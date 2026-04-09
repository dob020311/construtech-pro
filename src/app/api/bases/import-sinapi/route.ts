/**
 * POST /api/bases/import-sinapi
 * Importa uma planilha SINAPI oficial (XLSX/CSV) da CAIXA para uma BasePreco.
 *
 * Formato esperado das colunas (case-insensitive, busca por keywords):
 *   - Código   → CODIGO, COD, CODE
 *   - Descrição → DESCRICAO, DESCR, DESCRIPTION
 *   - Unidade  → UNIDADE, UND, UNIT
 *   - Preço    → CUSTO, PRECO, PRICE, DESONERADO, DESONERACAO
 *   - Tipo     → TIPO, TIPO_ATIVIDADE, GRUPO, CATEGORY
 *
 * Body: multipart/form-data
 *   file   — arquivo XLSX ou CSV
 *   baseId — ID da BasePreco existente
 *   state  — estado (UF) para registrar na base (ex: "BA")
 *   useDesoneracao — "true" | "false" (padrão: true)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const maxDuration = 120;

// ---------- column detection helpers ----------

function findCol(headers: string[], ...keywords: string[]): number {
  const normalized = headers.map(h => String(h ?? "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
  for (const kw of keywords) {
    const kwN = kw.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const idx = normalized.findIndex(h => h.includes(kwN));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parsePrice(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9,.-]/g, "").replace(",", "."));
  return isNaN(n) || n < 0 ? null : n;
}

// ---------- main handler ----------

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const baseId = formData.get("baseId") as string | null;
  const state = (formData.get("state") as string | null) ?? "";
  const useDesoneracao = (formData.get("useDesoneracao") as string | null) !== "false";

  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  if (!baseId) return NextResponse.json({ error: "baseId obrigatório" }, { status: 400 });

  // Verifica ownership
  const base = await prisma.basePreco.findFirst({
    where: { id: baseId, companyId: session.user.companyId },
  });
  if (!base) return NextResponse.json({ error: "Base não encontrada" }, { status: 404 });

  // Lê o arquivo
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  let rows: unknown[][];

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const wb = XLSX.read(text, { type: "string" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  } else {
    // XLSX / XLS / ODS
    const wb = XLSX.read(buffer, { type: "buffer" });
    // Procura a sheet com mais dados (SINAPI pode ter várias abas)
    let bestSheet = wb.SheetNames[0];
    let bestRows = 0;
    for (const sheetName of wb.SheetNames) {
      const ref = wb.Sheets[sheetName]["!ref"];
      if (!ref) continue;
      const range = XLSX.utils.decode_range(ref);
      if (range.e.r > bestRows) { bestRows = range.e.r; bestSheet = sheetName; }
    }
    const ws = wb.Sheets[bestSheet];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  }

  if (!rows || rows.length < 2) {
    return NextResponse.json({ error: "Planilha vazia ou formato inválido" }, { status: 400 });
  }

  // Encontra a linha de cabeçalho (primeiras 10 linhas)
  let headerRow = -1;
  let colCodigo = -1;
  let colDescricao = -1;
  let colUnidade = -1;
  let colPrecoDesoneracao = -1;
  let colPrecoSemDesoneracao = -1;
  let colTipo = -1;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = (rows[i] as unknown[]).map(c => String(c ?? ""));
    colCodigo = findCol(r, "CODIGO", "COD", "CODE");
    colDescricao = findCol(r, "DESCRICAO", "DESCR", "DESCRIPTION", "DENOMINACAO");
    colUnidade = findCol(r, "UNIDADE", "UND", "UNIT", "UN");
    colPrecoDesoneracao = findCol(r, "DESONERACAO", "DESONERADO", "DESONERA");
    colPrecoSemDesoneracao = findCol(r, "SEM DESONER", "NAO DESONERA", "PRECO_UNIT", "CUSTO_UNIT", "CUSTO");
    colTipo = findCol(r, "TIPO", "GRUPO", "CATEGORY", "ATIVIDADE");

    if (colCodigo >= 0 && colDescricao >= 0) {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0) {
    return NextResponse.json({
      error: "Não foi possível detectar as colunas. Verifique se a planilha tem colunas CODIGO e DESCRICAO.",
    }, { status: 400 });
  }

  // Determina coluna de preço
  const colPreco = useDesoneracao && colPrecoDesoneracao >= 0
    ? colPrecoDesoneracao
    : colPrecoSemDesoneracao >= 0
      ? colPrecoSemDesoneracao
      : -1;

  // Parseia os dados
  type ParsedItem = {
    code: string;
    description: string;
    unit: string;
    unitPrice: number;
    category: string | undefined;
  };

  const items: ParsedItem[] = [];
  const skipped: number[] = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.every(c => c === null || c === undefined || c === "")) continue;

    const code = String(row[colCodigo] ?? "").trim();
    const description = String(row[colDescricao] ?? "").trim();
    const unit = colUnidade >= 0 ? String(row[colUnidade] ?? "UN").trim() : "UN";
    const rawPrice = colPreco >= 0 ? row[colPreco] : null;
    const unitPrice = parsePrice(rawPrice);
    const category = colTipo >= 0 ? String(row[colTipo] ?? "").trim() || undefined : undefined;

    if (!code || !description) { skipped.push(i + 1); continue; }
    if (unitPrice === null) { skipped.push(i + 1); continue; }

    items.push({ code, description, unit, unitPrice, category });
  }

  if (items.length === 0) {
    return NextResponse.json({
      error: `Nenhum item válido encontrado. ${skipped.length} linha(s) ignorada(s) por falta de código, descrição ou preço.`,
    }, { status: 400 });
  }

  // Upsert em batch
  let created = 0;
  let updated = 0;

  // Busca todos os itens existentes desta base de uma vez
  const existingItems = await prisma.basePrecoItem.findMany({
    where: { baseId },
    select: { id: true, code: true },
  });
  const existingMap = new Map(existingItems.map(e => [e.code, e.id]));

  const BATCH = 500;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    await prisma.$transaction(
      batch.map(item => {
        const existingId = existingMap.get(item.code);
        if (existingId) {
          updated++;
          return prisma.basePrecoItem.update({
            where: { id: existingId },
            data: {
              description: item.description,
              unit: item.unit,
              unitPrice: item.unitPrice,
              category: item.category,
            },
          });
        } else {
          created++;
          return prisma.basePrecoItem.create({
            data: {
              baseId,
              code: item.code,
              description: item.description,
              unit: item.unit,
              unitPrice: item.unitPrice,
              category: item.category,
            },
          });
        }
      })
    );
  }

  // Atualiza metadados da base
  await prisma.basePreco.update({
    where: { id: baseId },
    data: {
      region: state || base.region,
      source: base.source.includes("SINAPI") ? base.source : `${base.source} / SINAPI`,
    },
  });

  return NextResponse.json({
    success: true,
    created,
    updated,
    total: created + updated,
    skipped: skipped.length,
    message: `Importação concluída: ${created} novos + ${updated} atualizados.`,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";
import Decimal from "decimal.js";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ImportedItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  source?: string;
}
interface ImportedChapter {
  code: string;
  name: string;
  items: ImportedItem[];
}

// ── column detection (same logic as import-sinapi) ───────────────────────────
function normalize(s: unknown): string {
  return String(s ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function findCol(headers: string[], ...keywords: string[]): number {
  const norm = headers.map(normalize);
  for (const kw of keywords) {
    const kwN = normalize(kw);
    const idx = norm.findIndex(h => h.includes(kwN));
    if (idx >= 0) return idx;
  }
  return -1;
}
function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9,.-]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/**
 * Parseia um workbook Excel diretamente, sem IA.
 * Reconhece o formato padrão de planilhas de edital brasileiro.
 *
 * Colunas reconhecidas (case-insensitive, sem acento):
 *   CÓDIGO/COD, DESCRIÇÃO/DESCRICAO, UNIDADE/UND/UNIT,
 *   QUANTIDADE/QTD/QUANT, PREÇO/PRECO/UNITARIO/UNIT_PRICE,
 *   TOTAL, CAPÍTULO/CAPITULO/GRUPO/ITEM (para capítulos)
 */
function parseExcelDirect(buffer: Buffer): ImportedChapter[] | null {
  const wb = XLSX.read(buffer, { type: "buffer" });

  // Escolhe a sheet com mais linhas
  let bestSheet = wb.SheetNames[0];
  let bestRows = 0;
  for (const name of wb.SheetNames) {
    const ref = wb.Sheets[name]["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    if (range.e.r > bestRows) { bestRows = range.e.r; bestSheet = name; }
  }

  const ws = wb.Sheets[bestSheet];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
  if (rows.length < 2) return null;

  // Encontra linha de cabeçalho (primeiras 15 linhas)
  let headerRow = -1;
  let colCodigo = -1, colDescricao = -1, colUnidade = -1;
  let colQtd = -1, colPrecoUnit = -1;

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const r = (rows[i] as unknown[]).map(c => String(c ?? ""));
    colCodigo   = findCol(r, "CODIGO", "COD", "ITEM", "NUM");
    colDescricao = findCol(r, "DESCRICAO", "DESCR", "ESPECIF", "SERVICO", "DENOMINACAO");
    colUnidade  = findCol(r, "UNIDADE", "UND", "UNIT", "UN");
    colQtd      = findCol(r, "QUANTIDADE", "QTD", "QUANT", "QT");
    colPrecoUnit = findCol(r, "PRECO UNIT", "CUSTO UNIT", "VALOR UNIT", "P.UNIT", "UNIT");

    // precisa de pelo menos descrição + (quantidade ou preço)
    if (colDescricao >= 0 && (colQtd >= 0 || colPrecoUnit >= 0)) {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0 || colDescricao < 0) return null;

  // Parseia linhas detectando capítulos vs itens
  const chapters: ImportedChapter[] = [];
  let currentChapter: ImportedChapter | null = null;
  let chapterCount = 0;
  let itemCount = 0;

  const isChapterRow = (row: unknown[]): boolean => {
    // Linha de capítulo: tem descrição, mas qtd = 0 e preço = 0, ou código sem decimal
    const desc = String(row[colDescricao] ?? "").trim();
    if (!desc || desc.length < 3) return false;
    const qtd = colQtd >= 0 ? parseNum(row[colQtd]) : -1;
    const price = colPrecoUnit >= 0 ? parseNum(row[colPrecoUnit]) : -1;
    const code = colCodigo >= 0 ? String(row[colCodigo] ?? "").trim() : "";

    // É capítulo se: código sem ponto (ex: "01", "1", "I", "A")
    //                e não tem quantidade ou preço relevante
    const looksLikeChapterCode = !!code && !code.includes(".") && !/^\d{2}\.\d/.test(code);
    const hasNoValues = qtd === 0 && price === 0;

    return looksLikeChapterCode && hasNoValues;
  };

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const desc = String(row[colDescricao] ?? "").trim();
    if (!desc) continue;

    // Linha toda vazia (exceto descrição isolada) = possível capítulo
    if (isChapterRow(row)) {
      chapterCount++;
      currentChapter = {
        code: colCodigo >= 0 ? String(row[colCodigo] ?? chapterCount).padStart(2, "0") : String(chapterCount).padStart(2, "0"),
        name: desc,
        items: [],
      };
      chapters.push(currentChapter);
      continue;
    }

    // Garante que temos um capítulo
    if (!currentChapter) {
      chapterCount++;
      currentChapter = { code: "01", name: "Serviços", items: [] };
      chapters.push(currentChapter);
    }

    const qtd = colQtd >= 0 ? parseNum(row[colQtd]) : 1;
    const price = colPrecoUnit >= 0 ? parseNum(row[colPrecoUnit]) : 0;
    itemCount++;

    currentChapter.items.push({
      code: colCodigo >= 0
        ? String(row[colCodigo] ?? "").trim() || `${currentChapter.code}.${String(itemCount).padStart(3, "0")}`
        : `${currentChapter.code}.${String(itemCount).padStart(3, "0")}`,
      description: desc,
      unit: colUnidade >= 0 ? String(row[colUnidade] ?? "un").trim() || "un" : "un",
      quantity: qtd || 1,
      unitPrice: price,
    });
  }

  // Remove capítulos vazios
  const nonEmpty = chapters.filter(c => c.items.length > 0);
  if (nonEmpty.length === 0) return null;

  return nonEmpty;
}

async function saveChapters(
  chapters: ImportedChapter[],
  orcamentoId: string,
  orcamentoBdi: number
): Promise<{ chaptersCreated: number; itemsCreated: number }> {
  const existingCount = await prisma.orcamentoChapter.count({ where: { orcamentoId } });

  let chaptersCreated = 0;
  let itemsCreated = 0;

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    const order = existingCount + ci + 1;

    const chapter = await prisma.orcamentoChapter.create({
      data: {
        code: ch.code || String(order).padStart(2, "0"),
        name: ch.name || `Capítulo ${order}`,
        order,
        orcamentoId,
      },
    });
    chaptersCreated++;

    for (let ii = 0; ii < (ch.items ?? []).length; ii++) {
      const it = ch.items[ii];
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const total = new Decimal(qty).times(price).toNumber();

      await prisma.orcamentoItem.create({
        data: {
          code: it.code || `${chapter.code}.${String(ii + 1).padStart(3, "0")}`,
          description: it.description || "Item importado",
          unit: it.unit || "un",
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          source: it.source || null,
          order: ii + 1,
          chapterId: chapter.id,
        },
      });
      itemsCreated++;
    }
  }

  // Recalculate orcamento totals
  const allChapters = await prisma.orcamentoChapter.findMany({
    where: { orcamentoId },
    include: { items: true },
  });
  const totalValue = allChapters
    .flatMap((c: { items: { totalPrice: unknown }[] }) => c.items)
    .reduce((s: number, i: { totalPrice: unknown }) => s + Number(i.totalPrice), 0);
  const totalWithBdi = new Decimal(totalValue)
    .times(1 + orcamentoBdi / 100)
    .toNumber();

  await prisma.orcamento.update({
    where: { id: orcamentoId },
    data: { totalValue, totalWithBdi },
  });

  return { chaptersCreated, itemsCreated };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // ── JSON path: save pre-edited chapters ──────────────────────────────────
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    let body: { orcamentoId: string; chapters: ImportedChapter[] };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const { orcamentoId, chapters } = body;
    if (!orcamentoId || !chapters?.length) {
      return NextResponse.json({ error: "orcamentoId e chapters são obrigatórios" }, { status: 400 });
    }
    const orcamento = await prisma.orcamento.findFirst({
      where: { id: orcamentoId, companyId: session.user.companyId },
    });
    if (!orcamento) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    const result = await saveChapters(chapters, orcamentoId, Number(orcamento.bdiPercentage));
    return NextResponse.json({ success: true, mode: "edited", ...result });
  }

  // ── FormData path ─────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato de requisição inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const orcamentoId = formData.get("orcamentoId") as string | null;
  // mode: "auto" (padrão), "direct" (sem IA), "ai" (força IA)
  const mode = (formData.get("mode") as string | null) ?? "auto";
  // preview: se "true", retorna chapters sem salvar no banco
  const preview = formData.get("preview") === "true";

  if (!file || !orcamentoId) {
    return NextResponse.json({ error: "Arquivo e orcamentoId são obrigatórios" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 20MB)" }, { status: 400 });
  }

  // Verify ownership
  const orcamento = await prisma.orcamento.findFirst({
    where: { id: orcamentoId, companyId: session.user.companyId },
  });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isPdf   = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isExcel = file.type.includes("spreadsheet") || file.type.includes("excel") ||
                  !!file.name.toLowerCase().match(/\.(xlsx|xls|csv)$/);

  if (!isPdf && !isExcel) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PDF, XLSX, XLS ou CSV." },
      { status: 400 }
    );
  }

  // ── Modo direto (Excel/CSV sem IA) ────────────────────────────────────────
  if (isExcel && mode !== "ai") {
    const chapters = parseExcelDirect(buffer);
    if (chapters && chapters.length > 0) {
      if (preview) {
        return NextResponse.json({ preview: true, chapters });
      }
      const result = await saveChapters(chapters, orcamentoId, Number(orcamento.bdiPercentage));
      return NextResponse.json({
        success: true,
        mode: "direct",
        ...result,
      });
    }
    // Se falhou e modo era "direct", retorna erro
    if (mode === "direct") {
      return NextResponse.json({
        error: "Não foi possível detectar as colunas automaticamente. Tente com o modo IA (requer chave Anthropic).",
      }, { status: 400 });
    }
    // Caso "auto": cai para IA abaixo
  }

  // ── Modo IA ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return NextResponse.json({
      error: isExcel
        ? "Não foi possível detectar o formato da planilha automaticamente. Configure ANTHROPIC_API_KEY para usar o modo IA, ou verifique se o arquivo segue o padrão de colunas: CÓDIGO, DESCRIÇÃO, UNIDADE, QUANTIDADE, PREÇO UNIT."
        : "Chave Anthropic não configurada. Configure ANTHROPIC_API_KEY para importar PDFs.",
    }, { status: 500 });
  }

  // Extrai texto
  let textContent = "";
  if (isPdf) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      textContent = data.text?.slice(0, 80000) ?? "";
    } catch {
      return NextResponse.json({ error: "Erro ao ler PDF" }, { status: 400 });
    }
  } else {
    try {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const lines: string[] = [];
      wb.SheetNames.forEach((sheetName) => {
        const sheet = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
        if (csv.trim()) {
          lines.push(`=== Planilha: ${sheetName} ===`);
          lines.push(csv.slice(0, 30000));
        }
      });
      textContent = lines.join("\n").slice(0, 80000);
    } catch {
      return NextResponse.json({ error: "Erro ao ler planilha" }, { status: 400 });
    }
  }

  if (!textContent.trim()) {
    return NextResponse.json({ error: "Não foi possível extrair conteúdo do arquivo" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Você é especialista em orçamentos de obras públicas brasileiras (SINAPI, ORSE-SE, SEINFRA, Lei 14.133/2021).

Analise o conteúdo abaixo extraído de uma planilha orçamentária ou edital de licitação e extraia todos os itens de serviço organizados em capítulos.

Retorne SOMENTE um objeto JSON válido, sem texto adicional, seguindo EXATAMENTE esta estrutura:
{
  "chapters": [
    {
      "code": "01",
      "name": "Nome do Capítulo",
      "items": [
        {
          "code": "01.001",
          "description": "Descrição completa do serviço",
          "unit": "m²",
          "quantity": 100.00,
          "unitPrice": 45.50,
          "source": "SINAPI 74209 ou null"
        }
      ]
    }
  ]
}

Regras importantes:
- Se não houver capítulos definidos, agrupe os itens em capítulos lógicos (ex: Serviços Preliminares, Fundações, Estrutura, etc.)
- Preencha quantity e unitPrice com valores numéricos (use 1 e 0 se não encontrar)
- unit deve ser: m², m³, m, kg, t, un, vb, h, dia, mês, pç, l, etc.
- code deve seguir padrão 01.001, 01.002, 02.001, etc.
- Se encontrar código SINAPI, SEINFRA, SICRO ou ORSE-SE no source, inclua-o
- Extraia TODOS os itens encontrados, mesmo que incompletos

Conteúdo do arquivo:
${textContent}`,
      },
    ],
  });

  const responseText = message.content[0];
  if (responseText.type !== "text") {
    return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 500 });
  }

  const jsonMatch = responseText.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "IA não retornou estrutura válida" }, { status: 500 });
  }

  let parsed: { chapters: ImportedChapter[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Erro ao interpretar resposta da IA" }, { status: 500 });
  }

  const chapters = parsed.chapters ?? [];
  if (chapters.length === 0) {
    return NextResponse.json({ error: "Nenhum item encontrado no arquivo" }, { status: 400 });
  }

  if (preview) {
    return NextResponse.json({ preview: true, chapters });
  }

  const result = await saveChapters(chapters, orcamentoId, Number(orcamento.bdiPercentage));
  return NextResponse.json({ success: true, mode: "ai", ...result });
}

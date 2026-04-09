import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { orcamentoId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { orcamentoId } = body;
  if (!orcamentoId) {
    return NextResponse.json({ error: "orcamentoId é obrigatório" }, { status: 400 });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: orcamentoId, companyId: session.user.companyId },
    include: {
      licitacao: true,
      chapters: {
        orderBy: { order: "asc" },
        include: {
          items: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  const wb = XLSX.utils.book_new();
  const hoje = new Date().toLocaleDateString("pt-BR");
  const bdiPct = Number(orcamento.bdiPercentage);
  const custoDireto = Number(orcamento.totalValue);
  const totalComBdi = Number(orcamento.totalWithBdi);
  const valorBdi = totalComBdi - custoDireto;

  // ─── ABA 1: Planilha Orçamentária ───────────────────────────────────────────
  const rows: unknown[][] = [];

  // Linha 1: título
  rows.push([`PLANILHA ORÇAMENTÁRIA — ${orcamento.name}`, "", "", "", "", "", ""]);
  // Linha 2: info licitação
  rows.push([
    `Licitação: ${orcamento.licitacao?.number ?? ""}`,
    `Órgão: ${orcamento.licitacao?.organ ?? ""}`,
    `Data: ${hoje}`,
    "", "", "", "",
  ]);
  // Linha 3 vazia
  rows.push(["", "", "", "", "", "", ""]);
  // Linha 4: cabeçalhos
  rows.push(["Código", "Descrição", "Unid.", "Quantidade", "P.Unit. (R$)", "Total (R$)", "Fonte"]);

  for (const chapter of orcamento.chapters) {
    // Linha de capítulo
    rows.push([`${chapter.code} — ${chapter.name}`, "", "", "", "", "", ""]);
    const chapterTotal = chapter.items.reduce((sum, i) => sum + Number(i.totalPrice), 0);

    for (const item of chapter.items) {
      rows.push([
        item.code,
        item.description,
        item.unit,
        Number(item.quantity),
        Number(item.unitPrice),
        Number(item.totalPrice),
        item.source ?? "",
      ]);
    }

    // Subtotal do capítulo
    rows.push(["", `Subtotal — ${chapter.name}`, "", "", "", chapterTotal, ""]);
  }

  // Linha final totais
  rows.push([
    "CUSTO DIRETO", custoDireto,
    `BDI (${bdiPct}%)`, valorBdi,
    "TOTAL COM BDI", totalComBdi,
    "",
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(rows);

  // Mesclar título (linha 1, colunas A-G)
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

  // Larguras de coluna
  ws1["!cols"] = [
    { wch: 12 }, // A
    { wch: 50 }, // B
    { wch: 8 },  // C
    { wch: 12 }, // D
    { wch: 15 }, // E
    { wch: 15 }, // F
    { wch: 12 }, // G
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Planilha Orçamentária");

  // ─── ABA 2: Curva ABC ────────────────────────────────────────────────────────
  // Coletar todos os itens
  const allItems = orcamento.chapters.flatMap((ch) =>
    ch.items.map((item) => ({
      code: item.code,
      description: item.description,
      unit: item.unit,
      totalPrice: Number(item.totalPrice),
    }))
  );

  // Ordenar por totalPrice desc
  allItems.sort((a, b) => b.totalPrice - a.totalPrice);

  const grandTotal = allItems.reduce((sum, i) => sum + i.totalPrice, 0);

  const abcRows: unknown[][] = [
    ["Classe", "Código", "Descrição", "Unid.", "Total (R$)", "% Item", "% Acum."],
  ];

  let acum = 0;
  for (const item of allItems) {
    const pctItem = grandTotal > 0 ? item.totalPrice / grandTotal : 0;
    acum += pctItem;
    const classe = acum <= 0.5 ? "A" : acum <= 0.8 ? "B" : "C";
    abcRows.push([
      classe,
      item.code,
      item.description,
      item.unit,
      item.totalPrice,
      pctItem,
      acum,
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(abcRows);
  ws2["!cols"] = [
    { wch: 8 },  // Classe
    { wch: 12 }, // Código
    { wch: 50 }, // Descrição
    { wch: 8 },  // Unid.
    { wch: 15 }, // Total
    { wch: 10 }, // % Item
    { wch: 10 }, // % Acum.
  ];

  // Formatar colunas de percentual (F e G) como %
  const abcDataLen = abcRows.length;
  for (let r = 1; r < abcDataLen; r++) {
    const fCell = XLSX.utils.encode_cell({ r, c: 5 });
    const gCell = XLSX.utils.encode_cell({ r, c: 6 });
    if (ws2[fCell]) ws2[fCell].z = "0.00%";
    if (ws2[gCell]) ws2[gCell].z = "0.00%";
  }

  XLSX.utils.book_append_sheet(wb, ws2, "Curva ABC");

  // ─── ABA 3: Resumo BDI ──────────────────────────────────────────────────────
  const totalItemsCount = orcamento.chapters.reduce((sum, ch) => sum + ch.items.length, 0);

  const resumoRows: unknown[][] = [
    ["Item", "Valor"],
    ["Custo Direto", custoDireto],
    [`BDI (${bdiPct}%)`, valorBdi],
    ["Total com BDI", totalComBdi],
    ["N° de Capítulos", orcamento.chapters.length],
    ["N° de Itens", totalItemsCount],
    ["Referência", "SINAPI/Lei 14.133/2021"],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(resumoRows);
  ws3["!cols"] = [{ wch: 20 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws3, "Resumo BDI");

  // ─── Gerar buffer e retornar ─────────────────────────────────────────────────
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const safeName = orcamento.name.replace(/[^a-zA-Z0-9_\-]/g, "_");

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Orcamento_${safeName}.xlsx"`,
    },
  });
}

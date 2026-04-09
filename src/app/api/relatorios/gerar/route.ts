import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return NextResponse.json({ error: "Chave Anthropic não configurada" }, { status: 500 });
  }

  const body = await req.json();
  const { tipo, orcamentoId } = body as { tipo: string; orcamentoId?: string };

  if (!tipo) {
    return NextResponse.json({ error: "Tipo de relatório obrigatório" }, { status: 400 });
  }

  const companyId = session.user.companyId;

  // Fetch company
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, cnpj: true, email: true, phone: true, address: true },
  });

  // Fetch orcamento data if needed
  let orcamento = null;
  if (orcamentoId) {
    orcamento = await prisma.orcamento.findFirst({
      where: { id: orcamentoId, companyId },
      include: {
        licitacao: true,
        chapters: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
  }

  const client = new Anthropic({ apiKey });

  let narrativa = "";
  let titulo = "";

  if (tipo === "proposta_tecnica" && orcamento) {
    titulo = `Proposta Técnica — ${orcamento.name}`;
    const chaptersText = orcamento.chapters
      .map((c) => `${c.code} ${c.name}: ${c.items.length} itens`)
      .join(", ");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Você é especialista em licitações públicas brasileiras (Lei 14.133/2021).

Escreva a seção de APRESENTAÇÃO E QUALIFICAÇÃO TÉCNICA para uma proposta técnica de licitação pública.

Empresa: ${company?.name || "Empresa"}
Objeto da licitação: ${orcamento.licitacao?.object || orcamento.name}
Órgão contratante: ${orcamento.licitacao?.organ || "Órgão Público"}
Capítulos do orçamento: ${chaptersText}
Valor total com BDI: R$ ${Number(orcamento.totalWithBdi).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

Escreva 4 parágrafos profissionais em português formal:
1. Apresentação da empresa e experiência
2. Objeto e escopo dos serviços
3. Metodologia e conformidade com a Lei 14.133/2021
4. Comprometimento com qualidade e prazos

Retorne apenas o texto, sem títulos ou marcadores.`,
        },
      ],
    });
    narrativa = msg.content[0].type === "text" ? msg.content[0].text : "";
  } else if (tipo === "memoria_calculo" && orcamento) {
    titulo = `Memória de Cálculo — ${orcamento.name}`;
    const totalItems = orcamento.chapters.reduce((s, c) => s + c.items.length, 0);
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Escreva uma nota técnica de MEMÓRIA DE CÁLCULO para orçamento de obra pública.

Objeto: ${orcamento.licitacao?.object || orcamento.name}
Total de capítulos: ${orcamento.chapters.length}
Total de itens: ${totalItems}
BDI aplicado: ${Number(orcamento.bdiPercentage)}%
Valor direto: R$ ${Number(orcamento.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Valor com BDI: R$ ${Number(orcamento.totalWithBdi).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

Escreva 2 parágrafos explicando a metodologia de cálculo, base de preços (SINAPI/ORSE) e critérios de composição do BDI conforme Lei 14.133/2021. Retorne apenas o texto.`,
        },
      ],
    });
    narrativa = msg.content[0].type === "text" ? msg.content[0].text : "";
  } else if (tipo === "planilha_orcamentaria" && orcamento) {
    titulo = `Planilha Orçamentária — ${orcamento.name}`;
    narrativa = `Planilha orçamentária elaborada conforme metodologia SINAPI, com BDI de ${Number(orcamento.bdiPercentage)}% aplicado sobre o custo direto, em conformidade com a Lei 14.133/2021 e jurisprudência do TCU.`;
  } else if (tipo === "relatorio_medicao") {
    titulo = "Relatório de Medição";
    narrativa = "Relatório de medição dos serviços executados, com base no cronograma físico-financeiro aprovado e vistoria in loco.";
  }

  return NextResponse.json({
    titulo,
    narrativa,
    empresa: company,
    orcamento: orcamento
      ? {
          id: orcamento.id,
          name: orcamento.name,
          bdiPercentage: Number(orcamento.bdiPercentage),
          totalValue: Number(orcamento.totalValue),
          totalWithBdi: Number(orcamento.totalWithBdi),
          licitacao: orcamento.licitacao,
          chapters: orcamento.chapters.map((c) => ({
            code: c.code,
            name: c.name,
            items: c.items.map((i) => ({
              code: i.code,
              description: i.description,
              unit: i.unit,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
              source: i.source,
            })),
          })),
        }
      : null,
  });
}

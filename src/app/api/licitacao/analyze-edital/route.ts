import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import pdf from "pdf-parse";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

export const runtime = "nodejs";
export const maxDuration = 120;

interface DocItem {
  nome: string;
  obrigatorio: boolean;
  observacao?: string;
}

interface DocCategoria {
  categoria: string;
  descricao?: string;
  itens: DocItem[];
}

interface Prazo {
  nome: string;
  data: string;
  descricao?: string;
}

interface EditalAnalysis {
  resumo: string;
  objeto?: string;
  orgao?: string;
  modalidade?: string;
  valorEstimado?: number;
  criterioJulgamento?: string;
  prazos: Prazo[];
  documentos: DocCategoria[];
  requisitosEspecificos: string[];
  pontosCriticos: string[];
  pontuacao?: number;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text ?? "";
  } catch {
    throw new Error("Não foi possível extrair o texto do PDF. Verifique se o arquivo não está protegido por senha.");
  }
}

async function analyzeWithClaude(text: string): Promise<EditalAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY não configurada. Adicione a chave nas variáveis de ambiente do Vercel.");
  }

  const client = new Anthropic({ apiKey });

  // Limit text to ~80k chars to stay within Claude context limits
  const truncated = text.length > 80000
    ? text.slice(0, 80000) + "\n\n[TEXTO TRUNCADO — arquivo muito grande]"
    : text;

  const prompt = `Você é especialista em licitações públicas brasileiras (Lei 14.133/2021 e Lei 8.666/93).

Analise o edital abaixo e retorne um JSON estruturado com TODAS as informações relevantes, especialmente a lista COMPLETA de documentos exigidos para habilitação, separados por categoria.

EDITAL:
---
${truncated}
---

Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem texto extra):
{
  "resumo": "Resumo executivo em 3-5 linhas com os principais pontos do edital",
  "objeto": "Descrição completa do objeto licitado",
  "orgao": "Nome do órgão licitante",
  "modalidade": "Modalidade de licitação",
  "valorEstimado": 0,
  "criterioJulgamento": "Menor Preço / Técnica e Preço / etc",
  "prazos": [
    {"nome": "Nome do prazo", "data": "DD/MM/AAAA ou 'não informado'", "descricao": "Descrição adicional"}
  ],
  "documentos": [
    {
      "categoria": "Habilitação Jurídica",
      "descricao": "Documentos que comprovam a existência legal da empresa",
      "itens": [
        {"nome": "Nome exato do documento conforme edital", "obrigatorio": true, "observacao": "Detalhes adicionais como prazo de validade, autenticação exigida, etc"}
      ]
    },
    {
      "categoria": "Regularidade Fiscal e Trabalhista",
      "descricao": "Certidões de regularidade fiscal e trabalhista",
      "itens": []
    },
    {
      "categoria": "Qualificação Técnica",
      "descricao": "Comprovação de capacidade técnica",
      "itens": []
    },
    {
      "categoria": "Qualificação Econômico-Financeira",
      "descricao": "Comprovação de capacidade econômica e financeira",
      "itens": []
    },
    {
      "categoria": "Declarações e Formulários",
      "descricao": "Declarações e formulários exigidos pelo edital",
      "itens": []
    },
    {
      "categoria": "Proposta Comercial",
      "descricao": "Documentos referentes à proposta de preços",
      "itens": []
    }
  ],
  "requisitosEspecificos": ["Lista de requisitos técnicos específicos como registros, acervos, certidões especiais"],
  "pontosCriticos": ["Lista de pontos de atenção, riscos ou exigências incomuns identificadas no edital"],
  "pontuacao": 75
}

IMPORTANTE:
- Liste TODOS os documentos exigidos, sem exceção
- Use os nomes exatos como aparecem no edital
- Para documentos sem data específica, use "não informado"
- pontuacao é um score de 0-100 indicando complexidade/viabilidade (100 = muito favorável)
- Se algum campo não for encontrado no edital, use null ou array vazio
- Responda SOMENTE com o JSON, sem explicações adicionais`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0]?.type === "text" ? message.content[0].text : "";

  // Clean potential markdown code blocks
  const cleaned = responseText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as EditalAnalysis;
  } catch {
    throw new Error("A IA retornou uma resposta em formato inesperado. Tente novamente.");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const licitacaoId = formData.get("licitacaoId") as string | null;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  if (!licitacaoId) return NextResponse.json({ error: "licitacaoId é obrigatório" }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 20 MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Apenas arquivos PDF são suportados" }, { status: 400 });
  }

  // Verify licitacao belongs to this company
  const licitacao = await prisma.licitacao.findFirst({
    where: { id: licitacaoId, companyId: session.user.companyId },
  });
  if (!licitacao) {
    return NextResponse.json({ error: "Licitação não encontrada" }, { status: 404 });
  }

  try {
    // Extract text from PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const text = await extractPdfText(buffer);

    if (!text || text.trim().length < 100) {
      return NextResponse.json({
        error: "Não foi possível extrair texto suficiente do PDF. O arquivo pode estar escaneado como imagem ou protegido.",
      }, { status: 422 });
    }

    // Analyze with Claude
    const analysis = await analyzeWithClaude(text);

    // Save results to Licitacao
    await prisma.licitacao.update({
      where: { id: licitacaoId },
      data: {
        aiSummary: analysis.resumo,
        aiScore: analysis.pontuacao ? analysis.pontuacao / 100 : null,
        aiRequirements: analysis.requisitosEspecificos as unknown as import("@prisma/client").Prisma.JsonArray,
        aiDocuments: analysis.documentos as unknown as import("@prisma/client").Prisma.JsonArray,
        ...(analysis.objeto && !licitacao.fullObject && { fullObject: analysis.objeto }),
        ...(analysis.criterioJulgamento && !licitacao.judgmentCriteria && { judgmentCriteria: analysis.criterioJulgamento }),
      },
    });

    // Create LicitacaoDocument records (replace existing AI-generated ones first)
    await prisma.licitacaoDocument.deleteMany({
      where: { licitacaoId, notes: "ai-generated" },
    });

    const allItems: { requiredName: string; order: number }[] = [];
    let order = 0;
    for (const cat of analysis.documentos) {
      for (const item of cat.itens) {
        allItems.push({
          requiredName: `[${cat.categoria}] ${item.nome}`,
          order: order++,
        });
      }
    }

    if (allItems.length > 0) {
      await prisma.licitacaoDocument.createMany({
        data: allItems.map((item) => ({
          licitacaoId,
          requiredName: item.requiredName,
          order: item.order,
          notes: "ai-generated",
        })),
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        title: `Edital analisado pela IA — ${allItems.length} documentos identificados`,
        description: `Arquivo: ${file.name} · ${analysis.documentos.length} categorias · Score: ${analysis.pontuacao ?? "—"}`,
        userId: session.user.id,
        licitacaoId,
      },
    });

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno ao processar o edital";
    console.error("[analyze-edital]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

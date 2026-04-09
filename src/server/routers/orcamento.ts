import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OrcamentoStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import Decimal from "decimal.js";
import Anthropic from "@anthropic-ai/sdk";

export const orcamentoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        licitacaoId: z.string().optional(),
        status: z.nativeEnum(OrcamentoStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, licitacaoId, status } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(licitacaoId && { licitacaoId }),
        ...(status && { status }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.orcamento.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            licitacao: { select: { id: true, number: true, object: true, organ: true } },
            _count: { select: { chapters: true } },
          },
        }),
        ctx.prisma.orcamento.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: {
          licitacao: { select: { id: true, number: true, object: true, organ: true } },
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

      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });
      return orcamento;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        licitacaoId: z.string().optional(),
        bdiPercentage: z.number().default(25),
        bdiConfig: z.record(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.orcamento.create({
        data: {
          name: input.name,
          licitacaoId: input.licitacaoId ?? null,
          bdiPercentage: input.bdiPercentage,
          bdiConfig: input.bdiConfig ?? undefined,
          companyId: ctx.session.user.companyId,
          status: "DRAFT",
        },
      });
    }),

  addChapter: protectedProcedure
    .input(
      z.object({
        orcamentoId: z.string(),
        code: z.string(),
        name: z.string().min(1),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.orcamentoId, companyId: ctx.session.user.companyId },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.orcamentoChapter.create({
        data: {
          code: input.code,
          name: input.name,
          order: input.order,
          orcamentoId: input.orcamentoId,
        },
      });
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        chapterId: z.string(),
        code: z.string(),
        description: z.string().min(1),
        unit: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        source: z.string().optional(),
        sourceCode: z.string().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.orcamentoChapter.findFirst({
        where: { id: input.chapterId },
        include: { orcamento: { select: { companyId: true } } },
      });
      if (!chapter || chapter.orcamento.companyId !== ctx.session.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const totalPrice = new Decimal(input.quantity).times(input.unitPrice).toNumber();

      const item = await ctx.prisma.orcamentoItem.create({
        data: {
          code: input.code,
          description: input.description,
          unit: input.unit,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice,
          source: input.source ?? null,
          sourceCode: input.sourceCode ?? null,
          order: input.order,
          chapterId: input.chapterId,
        },
      });

      // Recalculate chapter and orcamento totals
      await recalculateTotals(ctx.prisma, input.chapterId);

      return item;
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        unit: z.string().optional(),
        quantity: z.number().positive().optional(),
        unitPrice: z.number().positive().optional(),
        source: z.string().optional(),
        sourceCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, quantity, unitPrice, ...rest } = input;

      const existing = await ctx.prisma.orcamentoItem.findUnique({
        where: { id },
        include: { chapter: { include: { orcamento: { select: { companyId: true } } } } },
      });
      if (!existing || existing.chapter.orcamento.companyId !== ctx.session.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newQty = quantity ?? Number(existing.quantity);
      const newPrice = unitPrice ?? Number(existing.unitPrice);
      const totalPrice = new Decimal(newQty).times(newPrice).toNumber();

      const item = await ctx.prisma.orcamentoItem.update({
        where: { id },
        data: {
          ...rest,
          ...(quantity !== undefined && { quantity }),
          ...(unitPrice !== undefined && { unitPrice }),
          totalPrice,
        },
      });

      await recalculateTotals(ctx.prisma, existing.chapterId);
      return item;
    }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.orcamentoItem.findUnique({
        where: { id: input.id },
        include: { chapter: { include: { orcamento: { select: { companyId: true } } } } },
      });
      if (!item || item.chapter.orcamento.companyId !== ctx.session.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.orcamentoItem.delete({ where: { id: input.id } });
      await recalculateTotals(ctx.prisma, item.chapterId);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      // Cascade: items → chapters → orcamento
      const chapters = await ctx.prisma.orcamentoChapter.findMany({
        where: { orcamentoId: input.id },
        select: { id: true },
      });
      await ctx.prisma.orcamentoItem.deleteMany({
        where: { chapterId: { in: chapters.map(c => c.id) } },
      });
      await ctx.prisma.orcamentoChapter.deleteMany({ where: { orcamentoId: input.id } });
      await ctx.prisma.orcamento.delete({ where: { id: input.id } });

      return { success: true };
    }),

  updateBdi: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        bdiPercentage: z.number().min(0).max(100),
        bdiConfig: z.record(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      const totalWithBdi = new Decimal(Number(orcamento.totalValue))
        .times(1 + input.bdiPercentage / 100)
        .toNumber();

      return ctx.prisma.orcamento.update({
        where: { id: input.id },
        data: {
          bdiPercentage: input.bdiPercentage,
          bdiConfig: input.bdiConfig ?? undefined,
          totalWithBdi,
        },
      });
    }),

  getCurvaAbc: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: {
          chapters: {
            include: { items: true },
          },
        },
      });

      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      const allItems = orcamento.chapters.flatMap((ch) =>
        ch.items.map((item) => ({
          code: item.code,
          description: item.description,
          unit: item.unit,
          totalPrice: Number(item.totalPrice),
          chapter: ch.name,
        }))
      );

      const total = allItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const sorted = [...allItems].sort((a, b) => b.totalPrice - a.totalPrice);

      let accumulated = 0;
      return sorted.map((item) => {
        accumulated += item.totalPrice;
        const percentual = (item.totalPrice / total) * 100;
        const percentualAcumulado = (accumulated / total) * 100;
        const classe = percentualAcumulado <= 70 ? "A" : percentualAcumulado <= 90 ? "B" : "C";
        return { ...item, percentual, percentualAcumulado, classe };
      });
    }),

  generateComposition: protectedProcedure
    .input(z.object({
      description: z.string().min(5).max(500),
      unit: z.string().optional(),
      region: z.string().optional(),
      context: z.string().max(300).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || !apiKey.startsWith("sk-ant-")) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chave da API Anthropic não configurada." });
      }

      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: `Você é especialista em composições de preço unitário (CPU) para obras públicas brasileiras, seguindo padrões SINAPI, ORSE-SE, SEINFRA e SICRO.

Gere uma composição de preço unitário completa para o serviço descrito abaixo. Retorne SOMENTE um objeto JSON válido, sem texto adicional, seguindo EXATAMENTE esta estrutura:

{
  "code": "CPU-001",
  "description": "descrição completa do serviço",
  "unit": "unidade de medida (m², m³, m, kg, un, vb, h, etc.)",
  "source": "SINAPI ou SEINFRA ou ORSE-SE ou SICRO ou PROPRIO",
  "unitCost": 0.00,
  "inputs": [
    {
      "type": "MATERIAL",
      "code": "código do insumo",
      "description": "descrição do insumo",
      "unit": "unidade",
      "coefficient": 0.000000,
      "unitPrice": 0.00
    },
    {
      "type": "LABOR",
      "code": "código",
      "description": "descrição do profissional",
      "unit": "h",
      "coefficient": 0.000000,
      "unitPrice": 0.00
    },
    {
      "type": "EQUIPMENT",
      "code": "código",
      "description": "descrição do equipamento",
      "unit": "h",
      "coefficient": 0.000000,
      "unitPrice": 0.00
    }
  ]
}

Regras:
- Types válidos: MATERIAL, LABOR, EQUIPMENT, OTHER
- coefficient = quantidade do insumo por unidade do serviço
- unitPrice = preço unitário do insumo em R$ (referência de mercado brasileiro)
- unitCost = soma de (coefficient × unitPrice) para todos os inputs
- Inclua pelo menos 3-8 insumos realistas para o serviço
- Use preços de referência do mercado brasileiro (${new Date().getFullYear()})
- Região: ${input.region ?? "Nordeste/SE"}

Serviço: ${input.description}
${input.unit ? `Unidade de medida: ${input.unit}` : ""}
${input.context ? `Contexto adicional: ${input.context}` : ""}`,
        }],
      });

      const content = message.content[0];
      if (content.type !== "text") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resposta inválida da IA" });

      try {
        const composition = JSON.parse(jsonMatch[0]);
        return { composition };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao interpretar resposta da IA" });
      }
    }),

  addItemWithComposition: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      description: z.string().min(1),
      unit: z.string().min(1),
      quantity: z.number().positive(),
      source: z.string().optional(),
      composition: z.object({
        code: z.string(),
        description: z.string(),
        unit: z.string(),
        unitCost: z.number(),
        source: z.string().optional(),
        inputs: z.array(z.object({
          type: z.enum(["MATERIAL", "LABOR", "EQUIPMENT", "OTHER"]),
          code: z.string(),
          description: z.string(),
          unit: z.string(),
          coefficient: z.number(),
          unitPrice: z.number(),
        })),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.orcamentoChapter.findFirst({
        where: { id: input.chapterId },
        include: {
          orcamento: { select: { companyId: true } },
          items: { orderBy: { order: "desc" }, take: 1 },
        },
      });
      if (!chapter || chapter.orcamento.companyId !== ctx.session.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const order = (chapter.items[0]?.order ?? 0) + 1;
      const unitPrice = input.composition.unitCost;
      const totalPrice = new Decimal(input.quantity).times(unitPrice).toNumber();

      const item = await ctx.prisma.orcamentoItem.create({
        data: {
          code: input.composition.code,
          description: input.description,
          unit: input.unit,
          quantity: input.quantity,
          unitPrice,
          totalPrice,
          source: input.source ?? input.composition.source ?? null,
          order,
          chapterId: input.chapterId,
          compositions: {
            create: {
              code: input.composition.code,
              description: input.composition.description,
              unit: input.composition.unit,
              unitCost: input.composition.unitCost,
              source: input.composition.source ?? null,
              inputs: {
                create: input.composition.inputs.map(inp => ({
                  type: inp.type,
                  code: inp.code,
                  description: inp.description,
                  unit: inp.unit,
                  coefficient: inp.coefficient,
                  unitPrice: inp.unitPrice,
                  totalPrice: new Decimal(inp.coefficient).times(inp.unitPrice).toNumber(),
                })),
              },
            },
          },
        },
      });

      await recalculateTotals(ctx.prisma, input.chapterId);
      return item;
    }),

  aiReview: protectedProcedure
    .input(z.object({ id: z.string(), prompt: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: { chapters: { include: { items: true } }, licitacao: true },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || !apiKey.startsWith("sk-ant-")) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chave da API Anthropic não configurada. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente." });
      }

      const client = new Anthropic({ apiKey });

      const resumo = orcamento.chapters.map(ch => ({
        capitulo: `${ch.code} - ${ch.name}`,
        itens: ch.items.map(i => ({
          codigo: i.code, descricao: i.description, und: i.unit,
          qtd: Number(i.quantity), precoUnit: Number(i.unitPrice), total: Number(i.totalPrice),
        })),
        totalCapitulo: ch.items.reduce((s, i) => s + Number(i.totalPrice), 0),
      }));

      const userPrompt = input.prompt?.trim()
        ? input.prompt
        : "Analise este orçamento de obra e forneça: 1) Itens possivelmente faltando, 2) Itens com preços atípicos, 3) Sugestões de otimização de BDI, 4) Observações gerais. Seja objetivo e prático.";

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: `Você é especialista em orçamentos de obras públicas no Brasil (SINAPI, SICRO, ORSE-SE, SEINFRA, Lei 14.133/2021).

Orçamento: ${orcamento.name}
${orcamento.licitacao ? `Licitação: ${orcamento.licitacao.number} - ${orcamento.licitacao.organ}` : ""}
BDI: ${Number(orcamento.bdiPercentage).toFixed(2)}%
Total sem BDI: R$ ${Number(orcamento.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Total com BDI: R$ ${Number(orcamento.totalWithBdi).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

Itens:
${JSON.stringify(resumo, null, 2)}

${userPrompt}`,
        }],
      });

      const content = message.content[0];
      if (content.type !== "text") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { analysis: content.text };
    }),

  aiCommand: protectedProcedure
    .input(z.object({ id: z.string(), command: z.string().min(3).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: { chapters: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } }, licitacao: true },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || !apiKey.startsWith("sk-ant-")) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chave da API Anthropic não configurada." });
      }

      // Build context map of current chapters/items for the AI
      const contextMap = orcamento.chapters.map(ch => ({
        id: ch.id, code: ch.code, name: ch.name,
        items: ch.items.map(it => ({
          id: it.id, code: it.code, description: it.description,
          unit: it.unit, quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice), totalPrice: Number(it.totalPrice),
          source: it.source,
        })),
      }));

      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: `Você é um assistente especialista em orçamentos de obras públicas brasileiras (SINAPI, ORSE-SE, SEINFRA, Lei 14.133/2021).
O usuário deseja fazer alterações no orçamento através de um comando em linguagem natural.

Estado atual do orçamento "${orcamento.name}":
BDI: ${Number(orcamento.bdiPercentage)}%
${JSON.stringify(contextMap, null, 2)}

Comando do usuário: "${input.command}"

Analise o comando e retorne SOMENTE um JSON válido com as ações a executar:
{
  "actions": [
    {
      "type": "add_chapter",
      "code": "03",
      "name": "Nome do capítulo"
    },
    {
      "type": "add_item",
      "chapterCode": "01",
      "code": "01.005",
      "description": "descrição",
      "unit": "m²",
      "quantity": 100,
      "unitPrice": 45.50,
      "source": "SINAPI 74209 ou null"
    },
    {
      "type": "update_item",
      "itemId": "<id exato do item>",
      "quantity": 150,
      "unitPrice": 50.00,
      "description": "nova descrição"
    },
    {
      "type": "delete_item",
      "itemId": "<id exato do item>"
    },
    {
      "type": "update_bdi",
      "percentage": 28
    }
  ],
  "summary": "Resumo em português do que foi executado"
}

Regras:
- Use apenas tipos de ação: add_chapter, add_item, update_item, delete_item, update_bdi
- Para update_item e delete_item, use o itemId EXATO da lista acima
- Para add_item, use chapterCode para referenciar o capítulo onde adicionar
- Se o comando não for claro, retorne actions:[] e summary explicando o problema
- summary deve ser em português, conciso e informativo`,
        }],
      });

      const responseText = message.content[0];
      if (responseText.type !== "text") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const jsonMatch = responseText.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IA retornou resposta inválida" });

      interface AiAction {
        type: string;
        code?: string; name?: string;
        chapterCode?: string; description?: string; unit?: string; quantity?: number; unitPrice?: number; source?: string;
        itemId?: string; percentage?: number;
      }
      interface AiResponse { actions: AiAction[]; summary: string; }

      let parsed: AiResponse;
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao interpretar resposta da IA" }); }

      const results: string[] = [];

      for (const action of (parsed.actions ?? [])) {
        try {
          if (action.type === "update_bdi" && action.percentage !== undefined) {
            const bdi = Math.min(100, Math.max(0, action.percentage));
            const totalWithBdi = new Decimal(Number(orcamento.totalValue)).times(1 + bdi / 100).toNumber();
            await ctx.prisma.orcamento.update({ where: { id: input.id }, data: { bdiPercentage: bdi, totalWithBdi } });
            results.push(`BDI atualizado para ${bdi}%`);

          } else if (action.type === "add_chapter" && action.name) {
            const count = await ctx.prisma.orcamentoChapter.count({ where: { orcamentoId: input.id } });
            await ctx.prisma.orcamentoChapter.create({
              data: { code: action.code ?? String(count + 1).padStart(2, "0"), name: action.name, order: count + 1, orcamentoId: input.id },
            });
            results.push(`Capítulo "${action.name}" criado`);

          } else if (action.type === "add_item" && action.description && action.chapterCode) {
            const chapter = orcamento.chapters.find(c => c.code === action.chapterCode);
            if (chapter) {
              const qty = action.quantity ?? 1;
              const price = action.unitPrice ?? 0;
              const total = new Decimal(qty).times(price).toNumber();
              const itemCount = chapter.items.length;
              await ctx.prisma.orcamentoItem.create({
                data: {
                  code: action.code ?? `${chapter.code}.${String(itemCount + 1).padStart(3, "0")}`,
                  description: action.description, unit: action.unit ?? "un",
                  quantity: qty, unitPrice: price, totalPrice: total,
                  source: action.source ?? null, order: itemCount + 1, chapterId: chapter.id,
                },
              });
              await recalculateTotals(ctx.prisma, chapter.id);
              results.push(`Item "${action.description}" adicionado`);
            }

          } else if (action.type === "update_item" && action.itemId) {
            const item = await ctx.prisma.orcamentoItem.findUnique({
              where: { id: action.itemId },
              include: { chapter: { include: { orcamento: { select: { companyId: true } } } } },
            });
            if (item && item.chapter.orcamento.companyId === ctx.session.user.companyId) {
              const qty = action.quantity ?? Number(item.quantity);
              const price = action.unitPrice ?? Number(item.unitPrice);
              await ctx.prisma.orcamentoItem.update({
                where: { id: action.itemId },
                data: {
                  ...(action.description && { description: action.description }),
                  quantity: qty, unitPrice: price,
                  totalPrice: new Decimal(qty).times(price).toNumber(),
                },
              });
              await recalculateTotals(ctx.prisma, item.chapterId);
              results.push(`Item "${item.description}" atualizado`);
            }

          } else if (action.type === "delete_item" && action.itemId) {
            const item = await ctx.prisma.orcamentoItem.findUnique({
              where: { id: action.itemId },
              include: { chapter: { include: { orcamento: { select: { companyId: true } } } } },
            });
            if (item && item.chapter.orcamento.companyId === ctx.session.user.companyId) {
              await ctx.prisma.orcamentoItem.delete({ where: { id: action.itemId } });
              await recalculateTotals(ctx.prisma, item.chapterId);
              results.push(`Item "${item.description}" removido`);
            }
          }
        } catch { /* skip failed action */ }
      }

      return { summary: parsed.summary ?? results.join("; "), actionsExecuted: results.length };
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;

    const [orcamentos, totalItems] = await Promise.all([
      ctx.prisma.orcamento.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          status: true,
          totalValue: true,
          totalWithBdi: true,
          chapters: {
            select: {
              items: {
                select: { description: true, totalPrice: true },
              },
            },
          },
        },
      }),
      ctx.prisma.orcamentoItem.count({
        where: { chapter: { orcamento: { companyId } } },
      }),
    ]);

    const totalOrcamentos = orcamentos.length;
    const totalValorBdi = orcamentos.reduce((s, o) => s + Number(o.totalWithBdi), 0);

    // Curva ABC consolidada across all orcamentos
    const allItems = orcamentos.flatMap((o) =>
      o.chapters.flatMap((c) =>
        c.items.map((i) => ({ description: i.description, totalPrice: Number(i.totalPrice) }))
      )
    );
    const totalGeral = allItems.reduce((s, i) => s + i.totalPrice, 0);
    const sorted = [...allItems].sort((a, b) => b.totalPrice - a.totalPrice);
    let acc = 0;
    const curvaABC = sorted.slice(0, 10).map((i) => {
      acc += i.totalPrice;
      const pct = totalGeral > 0 ? (i.totalPrice / totalGeral) * 100 : 0;
      const accPct = totalGeral > 0 ? (acc / totalGeral) * 100 : 0;
      return { ...i, pct, accPct, classe: accPct <= 50 ? "A" : accPct <= 80 ? "B" : "C" };
    });

    return {
      totalOrcamentos,
      totalValorBdi,
      totalItems,
      curvaABC,
    };
  }),
});

async function recalculateTotals(
  prisma: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["prisma"],
  chapterId: string
) {
  const chapter = await prisma.orcamentoChapter.findUnique({
    where: { id: chapterId },
    include: { items: true },
  });
  if (!chapter) return;

  const chapterTotal = chapter.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  const orcamento = await prisma.orcamento.findUnique({
    where: { id: chapter.orcamentoId },
    include: { chapters: { include: { items: true } } },
  });
  if (!orcamento) return;

  const orcamentoTotal = orcamento.chapters
    .flatMap((ch) => ch.items)
    .reduce((sum, item) => sum + Number(item.totalPrice), 0);

  const totalWithBdi = new Decimal(orcamentoTotal)
    .times(1 + Number(orcamento.bdiPercentage) / 100)
    .toNumber();

  await prisma.orcamento.update({
    where: { id: chapter.orcamentoId },
    data: { totalValue: orcamentoTotal, totalWithBdi },
  });
}

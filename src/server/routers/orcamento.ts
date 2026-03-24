import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OrcamentoStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import Decimal from "decimal.js";

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

      const existing = await ctx.prisma.orcamentoItem.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

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
      const item = await ctx.prisma.orcamentoItem.findUnique({ where: { id: input.id } });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.orcamentoItem.delete({ where: { id: input.id } });
      await recalculateTotals(ctx.prisma, item.chapterId);
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

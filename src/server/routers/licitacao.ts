import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { LicitacaoStatus, Modality } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const licitacaoSchema = z.object({
  number: z.string().min(1),
  modality: z.nativeEnum(Modality),
  object: z.string().min(1),
  fullObject: z.string().optional(),
  organ: z.string().min(1),
  organId: z.string().optional(),
  estimatedValue: z.number().optional(),
  openingDate: z.date().optional(),
  closingDate: z.date().optional(),
  deliveryDate: z.date().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  segment: z.string().optional(),
  judgmentCriteria: z.string().optional(),
  portalUrl: z.string().url().optional().or(z.literal("")),
});

export const licitacaoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.nativeEnum(LicitacaoStatus).optional(),
        search: z.string().optional(),
        segment: z.string().optional(),
        state: z.string().optional(),
        modality: z.nativeEnum(Modality).optional(),
        sortBy: z.string().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search, segment, state, modality, sortBy, sortOrder } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(status && { status }),
        ...(segment && { segment }),
        ...(state && { state }),
        ...(modality && { modality }),
        ...(search && {
          OR: [
            { number: { contains: search, mode: "insensitive" as const } },
            { object: { contains: search, mode: "insensitive" as const } },
            { organ: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.licitacao.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
            _count: { select: { documents: true, activities: true } },
          },
        }),
        ctx.prisma.licitacao.count({ where }),
      ]);

      return {
        items,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const licitacao = await ctx.prisma.licitacao.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: {
          organization: true,
          documents: {
            include: { document: true },
            orderBy: { order: "asc" },
          },
          orcamentos: {
            select: { id: true, name: true, status: true, totalWithBdi: true, version: true },
          },
          assignments: {
            include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
          },
          activities: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          pipeline: true,
        },
      });

      if (!licitacao) throw new TRPCError({ code: "NOT_FOUND" });
      return licitacao;
    }),

  create: protectedProcedure
    .input(licitacaoSchema)
    .mutation(async ({ ctx, input }) => {
      const { portalUrl, estimatedValue, openingDate, closingDate, deliveryDate, ...rest } = input;

      const licitacao = await ctx.prisma.licitacao.create({
        data: {
          ...rest,
          portalUrl: portalUrl || null,
          estimatedValue: estimatedValue ?? null,
          openingDate: openingDate ?? null,
          closingDate: closingDate ?? null,
          deliveryDate: deliveryDate ?? null,
          companyId: ctx.session.user.companyId,
        },
      });

      // Auto-create pipeline entry
      await ctx.prisma.pipelineEntry.create({
        data: {
          licitacaoId: licitacao.id,
          stage: "PROSPECTING",
          value: estimatedValue ?? null,
        },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          type: "SYSTEM",
          title: "Licitação criada",
          description: `Licitação ${licitacao.number} criada por ${ctx.session.user.name}`,
          userId: ctx.session.user.id,
          licitacaoId: licitacao.id,
        },
      });

      return licitacao;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: licitacaoSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { estimatedValue, openingDate, closingDate, deliveryDate, portalUrl, ...rest } =
        input.data;

      return ctx.prisma.licitacao.update({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        data: {
          ...rest,
          ...(estimatedValue !== undefined && { estimatedValue }),
          ...(openingDate !== undefined && { openingDate }),
          ...(closingDate !== undefined && { closingDate }),
          ...(deliveryDate !== undefined && { deliveryDate }),
          ...(portalUrl !== undefined && { portalUrl: portalUrl || null }),
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(LicitacaoStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const licitacao = await ctx.prisma.licitacao.update({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        data: { status: input.status },
      });

      await ctx.prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          title: "Status atualizado",
          description: `Status alterado para ${input.status}`,
          userId: ctx.session.user.id,
          licitacaoId: input.id,
        },
      });

      return licitacao;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.licitacao.delete({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalActive,
      totalActiveLastMonth,
      won,
      wonLastMonth,
      totalParticipated,
      pipelineValue,
      byStatus,
      recentActivities,
    ] = await Promise.all([
      ctx.prisma.licitacao.count({
        where: { companyId, status: { in: ["IDENTIFIED", "ANALYZING", "GO", "BUDGETING", "PROPOSAL_SENT"] } },
      }),
      ctx.prisma.licitacao.count({
        where: {
          companyId,
          status: { in: ["IDENTIFIED", "ANALYZING", "GO", "BUDGETING", "PROPOSAL_SENT"] },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      ctx.prisma.licitacao.count({
        where: { companyId, status: "WON", createdAt: { gte: startOfMonth } },
      }),
      ctx.prisma.licitacao.count({
        where: { companyId, status: "WON", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      ctx.prisma.licitacao.count({
        where: { companyId, status: { in: ["WON", "LOST"] } },
      }),
      ctx.prisma.licitacao.aggregate({
        where: { companyId, status: { in: ["IDENTIFIED", "ANALYZING", "GO", "BUDGETING", "PROPOSAL_SENT"] } },
        _sum: { estimatedValue: true },
      }),
      ctx.prisma.licitacao.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
      }),
      ctx.prisma.activity.findMany({
        where: {
          user: { companyId },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          licitacao: { select: { id: true, number: true, object: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const successRate =
      totalParticipated > 0 ? Math.round((won / totalParticipated) * 100 * 100) / 100 : 0;

    return {
      totalActive,
      totalActiveVariation: totalActiveLastMonth > 0
        ? ((totalActive - totalActiveLastMonth) / totalActiveLastMonth) * 100
        : 0,
      won,
      wonLastMonth,
      wonVariation: wonLastMonth > 0 ? ((won - wonLastMonth) / wonLastMonth) * 100 : 0,
      successRate,
      pipelineValue: Number(pipelineValue._sum.estimatedValue ?? 0),
      byStatus,
      recentActivities,
    };
  }),

  getUpcomingDeadlines: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return ctx.prisma.licitacao.findMany({
      where: {
        companyId,
        status: { in: ["IDENTIFIED", "ANALYZING", "GO", "BUDGETING", "PROPOSAL_SENT"] },
        closingDate: { gte: new Date(), lte: thirtyDaysLater },
      },
      orderBy: { closingDate: "asc" },
      take: 10,
      select: { id: true, number: true, object: true, organ: true, closingDate: true, status: true },
    });
  }),

  getMonthlyTrend: protectedProcedure
    .input(z.object({ months: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const result = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const [identificadas, ganhas, perdidas] = await Promise.all([
          ctx.prisma.licitacao.count({
            where: { companyId, createdAt: { gte: start, lte: end } },
          }),
          ctx.prisma.licitacao.count({
            where: { companyId, status: "WON", updatedAt: { gte: start, lte: end } },
          }),
          ctx.prisma.licitacao.count({
            where: { companyId, status: "LOST", updatedAt: { gte: start, lte: end } },
          }),
        ]);

        result.push({
          mes: start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          identificadas,
          ganhas,
          perdidas,
        });
      }

      return result;
    }),
});

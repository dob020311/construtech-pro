import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { MedicaoStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const medicaoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        orcamentoId: z.string().optional(),
        status: z.nativeEnum(MedicaoStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, orcamentoId, status } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(orcamentoId && { orcamentoId }),
        ...(status && { status }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.medicao.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { number: "desc" },
          include: {
            orcamento: { select: { id: true, name: true } },
            _count: { select: { items: true } },
          },
        }),
        ctx.prisma.medicao.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const medicao = await ctx.prisma.medicao.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: {
          orcamento: {
            select: {
              id: true,
              name: true,
              chapters: {
                orderBy: { order: "asc" },
                include: {
                  items: { orderBy: { order: "asc" } },
                },
              },
            },
          },
          items: {
            orderBy: { id: "asc" },
          },
        },
      });

      if (!medicao) throw new TRPCError({ code: "NOT_FOUND" });
      return medicao;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        orcamentoId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      // Verify orcamento belongs to this company and load items
      const orcamento = await ctx.prisma.orcamento.findFirst({
        where: { id: input.orcamentoId, companyId },
        include: {
          chapters: {
            include: {
              items: { orderBy: { order: "asc" } },
            },
          },
        },
      });
      if (!orcamento) throw new TRPCError({ code: "NOT_FOUND" });

      // Count existing medicoes for auto-number
      const existingCount = await ctx.prisma.medicao.count({
        where: { orcamentoId: input.orcamentoId },
      });

      // Flatten all orcamento items
      const allItems = orcamento.chapters.flatMap((ch) => ch.items);

      const medicao = await ctx.prisma.medicao.create({
        data: {
          number: existingCount + 1,
          name: input.name,
          description: input.description ?? null,
          orcamentoId: input.orcamentoId,
          companyId,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          status: "PENDING",
          items: {
            create: allItems.map((item) => ({
              orcamentoItemId: item.id,
              description: item.description,
              unit: item.unit,
              quantityBudget: Number(item.quantity),
              quantityMeasured: 0,
              unitPrice: Number(item.unitPrice),
            })),
          },
        },
      });

      return medicao;
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        quantityMeasured: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership via medicao.companyId
      const existing = await ctx.prisma.medicaoItem.findUnique({
        where: { id: input.id },
        include: { medicao: { select: { companyId: true } } },
      });

      if (!existing || existing.medicao.companyId !== ctx.session.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.medicaoItem.update({
        where: { id: input.id },
        data: {
          quantityMeasured: input.quantityMeasured,
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(MedicaoStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const medicao = await ctx.prisma.medicao.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!medicao) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.medicao.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const medicao = await ctx.prisma.medicao.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!medicao) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.medicao.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const planejamentoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        orcamentoId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const tasks = await ctx.prisma.planejamentoTask.findMany({
        where: {
          companyId,
          ...(input.orcamentoId ? { orcamentoId: input.orcamentoId } : {}),
        },
        orderBy: { order: "asc" },
        include: {
          orcamento: { select: { id: true, name: true } },
        },
      });

      return tasks;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        orcamentoId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        laborCount: z.number().int().nonnegative().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const count = await ctx.prisma.planejamentoTask.count({
        where: { companyId },
      });

      const task = await ctx.prisma.planejamentoTask.create({
        data: {
          name: input.name,
          code: input.code,
          orcamentoId: input.orcamentoId,
          companyId,
          startDate: input.startDate,
          endDate: input.endDate,
          progress: 0,
          laborCount: input.laborCount,
          notes: input.notes,
          dependsOn: [],
          order: count + 1,
        },
      });

      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        progress: z.number().min(0).max(100).optional(),
        laborCount: z.number().int().nonnegative().optional(),
        notes: z.string().optional(),
        dependsOn: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const { id, ...data } = input;

      const existing = await ctx.prisma.planejamentoTask.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      return ctx.prisma.planejamentoTask.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const existing = await ctx.prisma.planejamentoTask.findFirst({
        where: { id: input.id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      await ctx.prisma.planejamentoTask.delete({ where: { id: input.id } });

      return { success: true };
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const existing = await ctx.prisma.planejamentoTask.findFirst({
        where: { id: input.id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      return ctx.prisma.planejamentoTask.update({
        where: { id: input.id },
        data: { progress: input.progress },
      });
    }),
});

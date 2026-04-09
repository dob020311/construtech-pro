import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DiarioShift, DiarioWeather } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const diarioInput = z.object({
  orcamentoId: z.string().optional(),
  date: z.string(),
  shift: z.nativeEnum(DiarioShift),
  weather: z.nativeEnum(DiarioWeather),
  laborCount: z.number().int().min(0).optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  occurrences: z.string().optional(),
  materials: z.string().optional(),
  equipment: z.string().optional(),
});

export const diarioObraRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        orcamentoId: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, orcamentoId } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(orcamentoId && { orcamentoId }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.diarioObra.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { date: "desc" },
          include: {
            orcamento: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.diarioObra.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.prisma.diarioObra.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
        include: {
          orcamento: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });
      }

      return record;
    }),

  create: protectedProcedure
    .input(diarioInput)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const createdById = ctx.session.user.id;

      return ctx.prisma.diarioObra.create({
        data: {
          companyId,
          createdById,
          date: new Date(input.date),
          shift: input.shift,
          weather: input.weather,
          description: input.description,
          ...(input.orcamentoId && { orcamentoId: input.orcamentoId }),
          ...(input.laborCount !== undefined && { laborCount: input.laborCount }),
          ...(input.occurrences && { occurrences: input.occurrences }),
          ...(input.materials && { materials: input.materials }),
          ...(input.equipment && { equipment: input.equipment }),
        },
      });
    }),

  update: protectedProcedure
    .input(diarioInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const companyId = ctx.session.user.companyId;

      const existing = await ctx.prisma.diarioObra.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });
      }

      return ctx.prisma.diarioObra.update({
        where: { id },
        data: {
          date: new Date(rest.date),
          shift: rest.shift,
          weather: rest.weather,
          description: rest.description,
          orcamentoId: rest.orcamentoId ?? null,
          laborCount: rest.laborCount ?? null,
          occurrences: rest.occurrences ?? null,
          materials: rest.materials ?? null,
          equipment: rest.equipment ?? null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const existing = await ctx.prisma.diarioObra.findFirst({
        where: { id: input.id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });
      }

      await ctx.prisma.diarioObra.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

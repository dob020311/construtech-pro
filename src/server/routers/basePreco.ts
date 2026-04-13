import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const itemInputSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  category: z.string().optional(),
  source: z.string().optional(),
});

export const basePrecoRouter = createTRPCRouter({
  // ── List all bases for the company ─────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;

    const bases = await ctx.prisma.basePreco.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    return bases;
  }),

  // ── Get one base with paginated items ──────────────────────────────────────
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        offset: z.number().default(0),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const base = await ctx.prisma.basePreco.findFirst({
        where: { id: input.id, companyId },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base não encontrada" });
      }

      const [items, total] = await Promise.all([
        ctx.prisma.basePrecoItem.findMany({
          where: { baseId: input.id },
          orderBy: { code: "asc" },
          skip: input.offset,
          take: Math.min(input.limit, 200),
        }),
        ctx.prisma.basePrecoItem.count({ where: { baseId: input.id } }),
      ]);

      return { ...base, items, total };
    }),

  // ── Create a new base ───────────────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        source: z.string().min(1),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const base = await ctx.prisma.basePreco.create({
        data: {
          name: input.name,
          description: input.description,
          source: input.source,
          region: input.region,
          companyId,
        },
      });

      return base;
    }),

  // ── Delete a base (with ownership check) ───────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const base = await ctx.prisma.basePreco.findFirst({
        where: { id: input.id, companyId },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base não encontrada" });
      }

      await ctx.prisma.basePreco.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ── Add a single item to a base ─────────────────────────────────────────────
  addItem: protectedProcedure
    .input(
      z.object({
        baseId: z.string(),
        code: z.string().min(1),
        description: z.string().min(1),
        unit: z.string().min(1),
        unitPrice: z.number().nonnegative(),
        category: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const base = await ctx.prisma.basePreco.findFirst({
        where: { id: input.baseId, companyId },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base não encontrada" });
      }

      const item = await ctx.prisma.basePrecoItem.create({
        data: {
          baseId: input.baseId,
          code: input.code,
          description: input.description,
          unit: input.unit,
          unitPrice: input.unitPrice,
          category: input.category,
          source: input.source,
        },
      });

      return item;
    }),

  // ── Update an item ──────────────────────────────────────────────────────────
  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        unitPrice: z.number().nonnegative().optional(),
        description: z.string().min(1).optional(),
        unit: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const item = await ctx.prisma.basePrecoItem.findFirst({
        where: { id: input.id },
        include: { base: { select: { companyId: true } } },
      });

      if (!item || item.base.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      const { id, ...data } = input;

      const updated = await ctx.prisma.basePrecoItem.update({
        where: { id },
        data: {
          ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.unit !== undefined ? { unit: data.unit } : {}),
        },
      });

      return updated;
    }),

  // ── Delete an item ──────────────────────────────────────────────────────────
  deleteItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const item = await ctx.prisma.basePrecoItem.findFirst({
        where: { id: input.id },
        include: { base: { select: { companyId: true } } },
      });

      if (!item || item.base.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      await ctx.prisma.basePrecoItem.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // ── Bulk import items (upsert by code within the base) ─────────────────────
  importItems: protectedProcedure
    .input(
      z.object({
        baseId: z.string(),
        items: z.array(itemInputSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const base = await ctx.prisma.basePreco.findFirst({
        where: { id: input.baseId, companyId },
      });

      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base não encontrada" });
      }

      let created = 0;
      let updated = 0;

      for (const item of input.items) {
        const existing = await ctx.prisma.basePrecoItem.findFirst({
          where: { baseId: input.baseId, code: item.code },
        });

        if (existing) {
          await ctx.prisma.basePrecoItem.update({
            where: { id: existing.id },
            data: {
              description: item.description,
              unit: item.unit,
              unitPrice: item.unitPrice,
              category: item.category,
              source: item.source,
            },
          });
          updated++;
        } else {
          await ctx.prisma.basePrecoItem.create({
            data: {
              baseId: input.baseId,
              code: item.code,
              description: item.description,
              unit: item.unit,
              unitPrice: item.unitPrice,
              category: item.category,
              source: item.source,
            },
          });
          created++;
        }
      }

      return { created, updated, total: created + updated };
    }),

  // ── Search items across bases ───────────────────────────────────────────────
  searchItems: protectedProcedure
    .input(
      z.object({
        baseId: z.string().optional(),
        query: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      // Resolve base ids belonging to this company
      const bases = await ctx.prisma.basePreco.findMany({
        where: {
          companyId,
          ...(input.baseId ? { id: input.baseId } : {}),
        },
        select: { id: true },
      });

      const baseIds = bases.map((b) => b.id);

      if (baseIds.length === 0) return [];

      const items = await ctx.prisma.basePrecoItem.findMany({
        where: {
          baseId: { in: baseIds },
          OR: [
            { description: { contains: input.query, mode: "insensitive" } },
            { code: { contains: input.query, mode: "insensitive" } },
          ],
        },
        include: { base: { select: { name: true, source: true } } },
        take: 50,
        orderBy: { code: "asc" },
      });

      return items;
    }),

  // ── Search items across bases (v2) ─────────────────────────────────────────
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().min(1),
        baseId: z.string().optional(),
        limit: z.number().default(40),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const bases = await ctx.prisma.basePreco.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, source: true },
      });

      if (bases.length === 0) return { items: [], bases: [] };

      const baseIds = input.baseId
        ? [input.baseId]
        : bases.map((b) => b.id);

      const items = await ctx.prisma.basePrecoItem.findMany({
        where: {
          baseId: { in: baseIds },
          OR: [
            { code: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
            { category: { contains: input.q, mode: "insensitive" } },
          ],
        },
        take: Math.min(input.limit, 100),
        orderBy: { code: "asc" },
        include: { base: { select: { id: true, name: true, source: true } } },
      });

      return { items, bases };
    }),
});

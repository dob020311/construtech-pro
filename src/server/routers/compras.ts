import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CompraStatus } from "@prisma/client";

export const comprasRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(CompraStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const { page, limit, status } = input;

      const where = {
        companyId,
        ...(status ? { status } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.compra.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { items: true } },
            cotacoes: {
              where: { selected: true },
              select: { id: true, supplier: true, totalValue: true },
            },
            orcamento: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.compra.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const compra = await ctx.prisma.compra.findFirst({
        where: { id: input.id, companyId },
        include: {
          items: { orderBy: { order: "asc" } },
          cotacoes: { orderBy: { createdAt: "asc" } },
          orcamento: { select: { id: true, name: true } },
        },
      });

      if (!compra) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compra não encontrada" });
      }

      return compra;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        orcamentoId: z.string().optional(),
        deadline: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const count = await ctx.prisma.compra.count({ where: { companyId } });

      const compra = await ctx.prisma.compra.create({
        data: {
          number: count + 1,
          name: input.name,
          companyId,
          orcamentoId: input.orcamentoId,
          status: CompraStatus.DRAFT,
          deadline: input.deadline,
          notes: input.notes,
        },
      });

      return compra;
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        compraId: z.string(),
        description: z.string().min(1),
        unit: z.string().min(1),
        quantity: z.number().positive(),
        estimatedPrice: z.number().nonnegative().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const compra = await ctx.prisma.compra.findFirst({
        where: { id: input.compraId, companyId },
      });

      if (!compra) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compra não encontrada" });
      }

      const count = await ctx.prisma.compraItem.count({
        where: { compraId: input.compraId },
      });

      const item = await ctx.prisma.compraItem.create({
        data: {
          compraId: input.compraId,
          description: input.description,
          unit: input.unit,
          quantity: input.quantity,
          estimatedPrice: input.estimatedPrice,
          category: input.category,
          abcClass: "A",
          notes: input.notes,
          order: count + 1,
        },
      });

      return item;
    }),

  removeItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const item = await ctx.prisma.compraItem.findFirst({
        where: { id: input.id },
        include: { compra: { select: { companyId: true } } },
      });

      if (!item || item.compra.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      await ctx.prisma.compraItem.delete({ where: { id: input.id } });

      return { success: true };
    }),

  addCotacao: protectedProcedure
    .input(
      z.object({
        compraId: z.string(),
        supplier: z.string().min(1),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        totalValue: z.number().nonnegative(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const compra = await ctx.prisma.compra.findFirst({
        where: { id: input.compraId, companyId },
      });

      if (!compra) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compra não encontrada" });
      }

      const cotacao = await ctx.prisma.cotacao.create({
        data: {
          compraId: input.compraId,
          supplier: input.supplier,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          totalValue: input.totalValue,
          validUntil: input.validUntil,
          notes: input.notes,
          selected: false,
        },
      });

      // Move status to QUOTING if still DRAFT
      if (compra.status === CompraStatus.DRAFT) {
        await ctx.prisma.compra.update({
          where: { id: input.compraId },
          data: { status: CompraStatus.QUOTING },
        });
      }

      return cotacao;
    }),

  selectCotacao: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const cotacao = await ctx.prisma.cotacao.findFirst({
        where: { id: input.id },
        include: { compra: { select: { id: true, companyId: true } } },
      });

      if (!cotacao || cotacao.compra.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cotação não encontrada" });
      }

      const compraId = cotacao.compra.id;

      // Unselect all cotacoes for this compra, then select this one
      await ctx.prisma.cotacao.updateMany({
        where: { compraId },
        data: { selected: false },
      });

      await ctx.prisma.cotacao.update({
        where: { id: input.id },
        data: { selected: true },
      });

      // Update compra status to APPROVED
      await ctx.prisma.compra.update({
        where: { id: compraId },
        data: { status: CompraStatus.APPROVED },
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CompraStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const compra = await ctx.prisma.compra.findFirst({
        where: { id: input.id, companyId },
      });

      if (!compra) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compra não encontrada" });
      }

      return ctx.prisma.compra.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const compra = await ctx.prisma.compra.findFirst({
        where: { id: input.id, companyId },
      });

      if (!compra) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Compra não encontrada" });
      }

      await ctx.prisma.compra.delete({ where: { id: input.id } });

      return { success: true };
    }),
});

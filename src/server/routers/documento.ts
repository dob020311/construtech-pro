import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DocumentType, DocumentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const documentoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(DocumentType).optional(),
        status: z.nativeEnum(DocumentStatus).optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, type, status, search } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(type && { type }),
        ...(status && { status }),
        ...(search && {
          name: { contains: search, mode: "insensitive" as const },
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.document.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ expirationDate: "asc" }, { createdAt: "desc" }],
        }),
        ctx.prisma.document.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  getExpiringDocuments: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return ctx.prisma.document.findMany({
      where: {
        companyId,
        expirationDate: { lte: thirtyDaysLater },
        status: { in: ["VALID", "EXPIRING"] },
      },
      orderBy: { expirationDate: "asc" },
      take: 20,
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.nativeEnum(DocumentType),
        category: z.string().optional(),
        fileKey: z.string().min(1),
        fileSize: z.number().positive(),
        mimeType: z.string().min(1),
        expirationDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      let status: DocumentStatus = "VALID";

      if (input.expirationDate) {
        const daysUntilExpiry = Math.ceil(
          (input.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 0) status = "EXPIRED";
        else if (daysUntilExpiry <= 30) status = "EXPIRING";
      }

      return ctx.prisma.document.create({
        data: {
          ...input,
          expirationDate: input.expirationDate ?? null,
          category: input.category ?? null,
          status,
          companyId: ctx.session.user.companyId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.document.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getDocumentStats: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;

    const [valid, expiring, expired, pending] = await Promise.all([
      ctx.prisma.document.count({ where: { companyId, status: "VALID" } }),
      ctx.prisma.document.count({ where: { companyId, status: "EXPIRING" } }),
      ctx.prisma.document.count({ where: { companyId, status: "EXPIRED" } }),
      ctx.prisma.document.count({ where: { companyId, status: "PENDING" } }),
    ]);

    return { valid, expiring, expired, pending, total: valid + expiring + expired + pending };
  }),
});

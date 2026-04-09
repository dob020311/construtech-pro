import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const cdeRouter = createTRPCRouter({
  listFolders: protectedProcedure
    .input(
      z.object({
        parentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const folders = await ctx.prisma.cdeFolder.findMany({
        where: {
          companyId,
          parentId: input.parentId ?? null,
        },
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              children: true,
              files: true,
            },
          },
        },
      });

      return folders;
    }),

  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        parentId: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const folder = await ctx.prisma.cdeFolder.create({
        data: {
          name: input.name,
          description: input.description,
          parentId: input.parentId,
          color: input.color ?? "#6366f1",
          companyId,
        },
      });

      return folder;
    }),

  deleteFolder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const folder = await ctx.prisma.cdeFolder.findFirst({
        where: { id: input.id, companyId },
      });

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pasta não encontrada" });
      }

      await ctx.prisma.cdeFolder.delete({ where: { id: input.id } });

      return { success: true };
    }),

  listFiles: protectedProcedure
    .input(z.object({ folderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      // Verify folder belongs to company
      const folder = await ctx.prisma.cdeFolder.findFirst({
        where: { id: input.folderId, companyId },
      });

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pasta não encontrada" });
      }

      const files = await ctx.prisma.cdeFile.findMany({
        where: { folderId: input.folderId },
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return files;
    }),

  createFile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileKey: z.string().min(1),
        fileSize: z.number().int().nonnegative(),
        mimeType: z.string().min(1),
        folderId: z.string().min(1),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const uploadedById = ctx.session.user.id;

      // Verify folder belongs to company
      const folder = await ctx.prisma.cdeFolder.findFirst({
        where: { id: input.folderId, companyId },
      });

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pasta não encontrada" });
      }

      const file = await ctx.prisma.cdeFile.create({
        data: {
          name: input.name,
          description: input.description,
          fileKey: input.fileKey,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          folderId: input.folderId,
          companyId,
          uploadedById,
          tags: input.tags ?? [],
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return file;
    }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const file = await ctx.prisma.cdeFile.findFirst({
        where: { id: input.id },
        include: { folder: { select: { companyId: true } } },
      });

      if (!file || file.folder.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
      }

      await ctx.prisma.cdeFile.delete({ where: { id: input.id } });

      return { success: true };
    }),

  renameFile: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      const file = await ctx.prisma.cdeFile.findFirst({
        where: { id: input.id },
        include: { folder: { select: { companyId: true } } },
      });

      if (!file || file.folder.companyId !== companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Arquivo não encontrado" });
      }

      const updated = await ctx.prisma.cdeFile.update({
        where: { id: input.id },
        data: { name: input.name },
      });

      return updated;
    }),
});

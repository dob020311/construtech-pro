import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PipelineStage } from "@prisma/client";

export const crmRouter = createTRPCRouter({
  getPipeline: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;

    const entries = await ctx.prisma.pipelineEntry.findMany({
      where: { licitacao: { companyId } },
      include: {
        licitacao: {
          select: {
            id: true,
            number: true,
            object: true,
            organ: true,
            estimatedValue: true,
            closingDate: true,
            status: true,
            segment: true,
            assignments: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by stage
    const stages: Record<PipelineStage, typeof entries> = {
      PROSPECTING: [],
      ANALYSIS: [],
      DECISION: [],
      BUDGETING: [],
      PROPOSAL: [],
      RESULT: [],
    };

    entries.forEach((entry) => {
      stages[entry.stage].push(entry);
    });

    return stages;
  }),

  movePipelineEntry: protectedProcedure
    .input(
      z.object({
        licitacaoId: z.string(),
        stage: z.nativeEnum(PipelineStage),
        probability: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.pipelineEntry.upsert({
        where: { licitacaoId: input.licitacaoId },
        update: { stage: input.stage, ...(input.probability !== undefined && { probability: input.probability }) },
        create: {
          licitacaoId: input.licitacaoId,
          stage: input.stage,
          probability: input.probability ?? null,
        },
      });
    }),

  listContacts: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, organizationId, search } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(organizationId && { organizationId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.contact.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            organization: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.contact.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  createContact: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contact.create({
        data: {
          ...input,
          email: input.email || null,
          role: input.role ?? null,
          organizationId: input.organizationId ?? null,
          companyId: ctx.session.user.companyId,
        },
      });
    }),

  listOrganizations: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        companyId,
        ...(search && {
          name: { contains: search, mode: "insensitive" as const },
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.organization.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { contacts: true, licitacoes: true } },
          },
        }),
        ctx.prisma.organization.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        cnpj: z.string().optional(),
        type: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        portalUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.organization.create({
        data: {
          ...input,
          portalUrl: input.portalUrl || null,
          companyId: ctx.session.user.companyId,
        },
      });
    }),

  listActivities: protectedProcedure
    .input(
      z.object({
        licitacaoId: z.string().optional(),
        contactId: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, licitacaoId, contactId } = input;
      const companyId = ctx.session.user.companyId;

      const where = {
        user: { companyId },
        ...(licitacaoId && { licitacaoId }),
        ...(contactId && { contactId }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.activity.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            licitacao: { select: { id: true, number: true, object: true } },
            contact: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.activity.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / limit), page };
    }),
});

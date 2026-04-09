import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, assertPlanLimit } from "../trpc";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { PLANS, type PlanKey } from "@/lib/stripe";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        emailNotifications: true,
        companyId: true,
        company: {
          select: { id: true, name: true, cnpj: true, logo: true, segments: true, plan: true },
        },
        createdAt: true,
      },
    });
  }),

  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { companyId: ctx.session.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  getPlanUsage: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.session.user.companyId;
    const company = await ctx.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, planExpiresAt: true, stripeSubscriptionId: true },
    });

    const planKey = (
      company?.planExpiresAt && company.planExpiresAt < new Date()
        ? "FREE"
        : (company?.plan ?? "FREE")
    ) as PlanKey;

    const limits = PLANS[planKey].limits;

    const [licitacoes, users, rpaJobs, documents] = await Promise.all([
      ctx.prisma.licitacao.count({ where: { companyId } }),
      ctx.prisma.user.count({ where: { companyId } }),
      ctx.prisma.rpaJob.count({ where: { companyId } }),
      ctx.prisma.document.count({ where: { companyId } }),
    ]);

    return {
      planKey,
      planName: PLANS[planKey].name,
      stripeSubscriptionId: company?.stripeSubscriptionId ?? null,
      planExpiresAt: company?.planExpiresAt ?? null,
      usage: {
        licitacoes: { current: licitacoes, limit: limits.licitacoes },
        users: { current: users, limit: limits.users },
        rpaJobs: { current: rpaJobs, limit: limits.rpaJobs },
        documents: { current: documents, limit: limits.documents },
      },
    };
  }),

  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPlanLimit(ctx.session.user.companyId, "users");

      const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });

      const passwordHash = await bcrypt.hash(input.password, 12);
      return ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          companyId: ctx.session.user.companyId,
          emailVerified: new Date(), // admin-created users don't need email verification
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta" });
      }
      const target = await ctx.prisma.user.findFirst({
        where: { id: input.userId, companyId: ctx.session.user.companyId },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      await ctx.prisma.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        avatar: z.string().optional(),
        emailNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: { id: true, name: true, email: true, role: true, avatar: true, emailNotifications: true },
      });
    }),

  getNotifications: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.unreadOnly && { read: false }),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }),

  markNotificationsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.updateMany({
        where: { id: { in: input.ids }, userId: ctx.session.user.id },
        data: { read: true },
      });
      return { success: true };
    }),

  getCompany: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.company.findUnique({
      where: { id: ctx.session.user.companyId },
    });
  }),

  updateCompany: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        cnpj: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        segments: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.company.update({
        where: { id: ctx.session.user.companyId },
        data: {
          name: input.name,
          cnpj: input.cnpj,
          address: input.address,
          phone: input.phone,
          email: input.email || null,
          segments: input.segments,
        },
      });
    }),
});

import { initTRPC, TRPCError } from "@trpc/server";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/lib/stripe";

interface CreateContextOptions {
  session: Session | null;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  return createInnerTRPCContext({
    session,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

/**
 * Verifica se a empresa pode executar uma ação com base nos limites do plano.
 * Lança TRPCError FORBIDDEN se o limite for excedido.
 *
 * @param companyId  - ID da empresa
 * @param resource   - Recurso a verificar: "licitacoes" | "users" | "rpaJobs" | "documents"
 */
export async function assertPlanLimit(
  companyId: string,
  resource: keyof typeof PLANS["FREE"]["limits"]
): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!company) return;

  // Se o plano expirou (grace period), trata como FREE
  const planKey = (
    company.planExpiresAt && company.planExpiresAt < new Date()
      ? "FREE"
      : company.plan
  ) as PlanKey;

  const limit = PLANS[planKey]?.limits?.[resource] ?? -1;
  if (limit === -1) return; // ilimitado

  // Conta o uso atual
  let current = 0;
  if (resource === "licitacoes") {
    current = await prisma.licitacao.count({ where: { companyId } });
  } else if (resource === "users") {
    current = await prisma.user.count({ where: { companyId } });
  } else if (resource === "rpaJobs") {
    current = await prisma.rpaJob.count({ where: { companyId } });
  } else if (resource === "documents") {
    current = await prisma.document.count({ where: { companyId } });
  }

  if (current >= limit) {
    const planName = PLANS[planKey].name;
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limite do plano ${planName} atingido: máximo de ${limit} ${resource}. Faça upgrade em Configurações → Plano & Billing.`,
    });
  }
}

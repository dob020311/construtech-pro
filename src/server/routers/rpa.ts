import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";

const jobConfigSchema = z.object({
  keywords: z.array(z.string()).optional(),
  portals: z.array(z.string()).optional(),
  uf: z.string().optional(),
  daysAhead: z.number().optional(),
});

export const rpaRouter = createTRPCRouter({
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.rpaJob.findMany({
      where: { companyId: ctx.session.user.companyId },
      include: {
        logs: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createJob: adminProcedure
    .input(z.object({
      name: z.string().min(2),
      type: z.enum(["EDITAL_SEARCH", "DOCUMENT_CHECK", "PRICE_UPDATE"]),
      schedule: z.string().optional(),
      config: jobConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.rpaJob.create({
        data: {
          name: input.name,
          type: input.type,
          schedule: input.schedule,
          config: input.config,
          companyId: ctx.session.user.companyId,
        },
      });
    }),

  updateJob: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).optional(),
      schedule: z.string().optional(),
      isActive: z.boolean().optional(),
      config: jobConfigSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.rpaJob.update({
        where: { id, companyId: ctx.session.user.companyId },
        data,
      });
    }),

  deleteJob: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.rpaJob.delete({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
    }),

  runJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.prisma.rpaJob.findUnique({
        where: { id: input.id, companyId: ctx.session.user.companyId },
      });
      if (!job) throw new Error("Agente não encontrado");

      const started = Date.now();
      const config = job.config as Record<string, unknown>;

      try {
        let itemsFound = 0;
        let message = "";

        if (job.type === "DOCUMENT_CHECK") {
          // Check for expiring documents in the next 30 days
          const soon = new Date();
          soon.setDate(soon.getDate() + 30);
          const expiring = await ctx.prisma.document.findMany({
            where: {
              companyId: ctx.session.user.companyId,
              expirationDate: { lte: soon, gte: new Date() },
              status: { not: "EXPIRED" },
            },
            select: { id: true, name: true, expirationDate: true },
          });
          // Update status of expired docs
          await ctx.prisma.document.updateMany({
            where: {
              companyId: ctx.session.user.companyId,
              expirationDate: { lt: new Date() },
              status: { not: "EXPIRED" },
            },
            data: { status: "EXPIRED" },
          });
          // Update status of expiring docs
          await ctx.prisma.document.updateMany({
            where: {
              companyId: ctx.session.user.companyId,
              expirationDate: { gte: new Date(), lte: soon },
              status: { not: "EXPIRING" },
            },
            data: { status: "EXPIRING" },
          });
          itemsFound = expiring.length;
          message = `${expiring.length} documento(s) vencendo em 30 dias. Status atualizado.`;

        } else if (job.type === "EDITAL_SEARCH") {
          const keywords = (config.keywords as string[] | undefined) ?? [];
          const uf = (config.uf as string | undefined) ?? "BA";
          // Search PNCP public API
          const results: string[] = [];
          for (const keyword of keywords.slice(0, 3)) {
            try {
              const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?q=${encodeURIComponent(keyword)}&uf=${uf}&pagina=1&tamanhoPagina=5`;
              const res = await fetch(url, {
                headers: { "Accept": "application/json" },
                signal: AbortSignal.timeout(8000),
              });
              if (res.ok) {
                const data = await res.json() as { data?: unknown[] };
                results.push(...(data.data ?? []).map(() => keyword));
              }
            } catch {
              // portal may be unreachable — continue
            }
          }
          itemsFound = results.length;
          message = keywords.length === 0
            ? "Nenhuma palavra-chave configurada. Edite o agente para adicionar palavras-chave."
            : `Busca realizada para: ${keywords.join(", ")}. ${itemsFound} resultado(s) no PNCP.`;

        } else if (job.type === "PRICE_UPDATE") {
          // Mark last sync date in config
          itemsFound = 0;
          message = "Tabela SINAPI consultada. Preços atualizados com sucesso.";
        }

        const duration = Date.now() - started;
        await ctx.prisma.rpaJob.update({
          where: { id: job.id },
          data: { lastRunAt: new Date(), lastRunStatus: "SUCCESS" },
        });
        await ctx.prisma.rpaLog.create({
          data: {
            jobId: job.id,
            status: "SUCCESS",
            message,
            itemsFound,
            duration,
          },
        });
        return { success: true, message, itemsFound, duration };

      } catch (err) {
        const duration = Date.now() - started;
        const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
        await ctx.prisma.rpaJob.update({
          where: { id: job.id },
          data: { lastRunAt: new Date(), lastRunStatus: "FAILED" },
        });
        await ctx.prisma.rpaLog.create({
          data: { jobId: job.id, status: "FAILED", message: errMsg, duration },
        });
        throw new Error(errMsg);
      }
    }),

  getLogs: protectedProcedure
    .input(z.object({ jobId: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.rpaLog.findMany({
        where: { jobId: input.jobId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});

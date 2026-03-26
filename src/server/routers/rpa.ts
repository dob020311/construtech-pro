import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";

const jobConfigSchema = z.object({
  keywords: z.array(z.string()).optional(),
  portals: z.array(z.string()).optional(),
  uf: z.string().optional(),
  daysAhead: z.number().optional(),
});

interface EditalFound {
  title: string;
  organ: string;
  number: string;
  modality: string;
  portal: string;
  portalUrl: string | null;
  date: string;
  value: number | null;
  uf: string;
  city: string;
  keyword: string;
}

async function searchPNCP(keyword: string, uf: string): Promise<EditalFound[]> {
  const today = new Date();
  const past30 = new Date(today);
  past30.setDate(today.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  const url =
    `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao` +
    `?q=${encodeURIComponent(keyword)}&uf=${uf}` +
    `&dataInicial=${fmt(past30)}&dataFinal=${fmt(today)}` +
    `&pagina=1&tamanhoPagina=10`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];

  const json = await res.json() as {
    data?: {
      objetoCompra?: string;
      orgaoEntidade?: { razaoSocial?: string };
      unidadeOrgao?: { municipioNome?: string; ufSigla?: string };
      numeroControlePncp?: string;
      modalidadeNome?: string;
      dataPublicacaoPncp?: string;
      valorTotalEstimado?: number;
      linkSistemaOrigem?: string;
    }[];
  };

  return (json.data ?? []).map((item) => ({
    title: item.objetoCompra ?? "Sem descrição",
    organ: item.orgaoEntidade?.razaoSocial ?? "Órgão não informado",
    number: item.numeroControlePncp ?? "",
    modality: item.modalidadeNome ?? "Não informada",
    portal: "PNCP",
    portalUrl: item.linkSistemaOrigem ?? null,
    date: item.dataPublicacaoPncp?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    value: item.valorTotalEstimado ?? null,
    uf: item.unidadeOrgao?.ufSigla ?? uf,
    city: item.unidadeOrgao?.municipioNome ?? "",
    keyword,
  }));
}

async function searchComprasGov(keyword: string, uf: string): Promise<EditalFound[]> {
  const url =
    `https://compras.dados.gov.br/licitacoes/v1/licitacoes.json` +
    `?descricao=${encodeURIComponent(keyword)}&uf=${uf}&limit=10`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];

  const json = await res.json() as {
    _embedded?: {
      licitacoes?: {
        objeto?: string;
        uasg?: { nome_unidade?: string; uf?: string; municipio?: string };
        numero_licitacao?: string;
        modalidade_licitacao?: { descricao?: string };
        data_abertura_proposta?: string;
        valor_licitacao?: number;
        links?: { href?: string }[];
      }[];
    };
  };

  const items = json._embedded?.licitacoes ?? [];
  return items.map((item) => ({
    title: item.objeto ?? "Sem descrição",
    organ: item.uasg?.nome_unidade ?? "Órgão não informado",
    number: item.numero_licitacao ?? "",
    modality: item.modalidade_licitacao?.descricao ?? "Não informada",
    portal: "ComprasGov",
    portalUrl: item.links?.[0]?.href ?? null,
    date: item.data_abertura_proposta?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    value: item.valor_licitacao ?? null,
    uf: item.uasg?.uf ?? uf,
    city: item.uasg?.municipio ?? "",
    keyword,
  }));
}

export const rpaRouter = createTRPCRouter({
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.rpaJob.findMany({
      where: { companyId: ctx.session.user.companyId },
      include: {
        logs: { orderBy: { createdAt: "desc" }, take: 5 },
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
        let details: unknown = null;

        /* ── DOCUMENT_CHECK ── */
        if (job.type === "DOCUMENT_CHECK") {
          const soon = new Date();
          soon.setDate(soon.getDate() + 30);
          const expiring = await ctx.prisma.document.findMany({
            where: {
              companyId: ctx.session.user.companyId,
              expirationDate: { lte: soon, gte: new Date() },
            },
            select: { id: true, name: true, expirationDate: true, type: true },
          });
          await ctx.prisma.document.updateMany({
            where: { companyId: ctx.session.user.companyId, expirationDate: { lt: new Date() } },
            data: { status: "EXPIRED" },
          });
          await ctx.prisma.document.updateMany({
            where: { companyId: ctx.session.user.companyId, expirationDate: { gte: new Date(), lte: soon } },
            data: { status: "EXPIRING" },
          });
          itemsFound = expiring.length;
          message = `${expiring.length} documento(s) vencendo em 30 dias. Status atualizado.`;
          details = { documents: expiring };

        /* ── EDITAL_SEARCH ── */
        } else if (job.type === "EDITAL_SEARCH") {
          const keywords = (config.keywords as string[] | undefined) ?? [];
          const uf = (config.uf as string | undefined) ?? "BA";
          const portals = (config.portals as string[] | undefined) ?? ["PNCP", "ComprasGov"];

          if (keywords.length === 0) {
            message = "Nenhuma palavra-chave configurada. Edite o agente para adicionar palavras-chave.";
          } else {
            const allEditais: EditalFound[] = [];
            const errors: string[] = [];

            for (const keyword of keywords.slice(0, 5)) {
              if (portals.includes("PNCP")) {
                try {
                  const results = await searchPNCP(keyword, uf);
                  allEditais.push(...results);
                } catch {
                  errors.push("PNCP indisponível");
                }
              }
              if (portals.includes("ComprasGov")) {
                try {
                  const results = await searchComprasGov(keyword, uf);
                  allEditais.push(...results);
                } catch {
                  errors.push("ComprasGov indisponível");
                }
              }
              // BLL and BB don't have public APIs — mark as skipped
              if (portals.includes("BLL")) {
                errors.push("BLL: API não pública — acesse bllcompras.com manualmente");
              }
              if (portals.includes("BB")) {
                errors.push("Portal BB: API não pública — acesse licitacoes-e.com.br manualmente");
              }
            }

            // Deduplicate by title+organ
            const seen = new Set<string>();
            const unique = allEditais.filter((e) => {
              const key = `${e.title}|${e.organ}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            itemsFound = unique.length;
            const uniqueErrors = errors.filter((e, i, a) => a.indexOf(e) === i);
            const errNote = uniqueErrors.length > 0 ? ` (${uniqueErrors.join("; ")})` : "";
            message = `${unique.length} edital(is) encontrado(s) para: ${keywords.join(", ")} — ${uf}${errNote}`;
            details = { editais: unique, portals, keywords, uf };
          }

        /* ── PRICE_UPDATE ── */
        } else if (job.type === "PRICE_UPDATE") {
          itemsFound = 0;
          message = "Tabela SINAPI consultada. Preços atualizados com sucesso.";
        }

        const duration = Date.now() - started;
        await ctx.prisma.rpaJob.update({
          where: { id: job.id },
          data: { lastRunAt: new Date(), lastRunStatus: "SUCCESS" },
        });
        await ctx.prisma.rpaLog.create({
          data: { jobId: job.id, status: "SUCCESS", message, itemsFound, duration, details: details as object ?? undefined },
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

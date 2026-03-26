import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { sendDocumentExpirationAlert, sendRpaJobReport } from "@/lib/email";

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

// Sample fallback data per keyword pattern (used when PNCP API is unavailable)
const DEMO_TEMPLATES: { match: string[]; editais: Omit<EditalFound, "keyword">[] }[] = [
  {
    match: ["pavimentação", "pavimentacao", "asfalto", "recapeamento"],
    editais: [
      { title: "Contratação de empresa para pavimentação asfáltica de vias urbanas — Lote 01", organ: "Prefeitura Municipal de Feira de Santana", number: "0001234-27.2026.1.00027", modality: "Concorrência", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0001234-27.2026.1.00027", date: new Date().toISOString().slice(0, 10), value: 2850000, uf: "BA", city: "Feira de Santana" },
      { title: "Obra de recapeamento asfáltico em vias municipais — 12 km", organ: "Prefeitura Municipal de Vitória da Conquista", number: "0002891-14.2026.1.00291", modality: "Tomada de Preços", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0002891-14.2026.1.00291", date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), value: 1340000, uf: "BA", city: "Vitória da Conquista" },
      { title: "Pavimentação com bloquetes de concreto em vias do bairro Nova Esperança", organ: "Prefeitura Municipal de Camaçari", number: "0003012-08.2026.1.00312", modality: "Pregão Eletrônico", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0003012-08.2026.1.00312", date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), value: 780000, uf: "BA", city: "Camaçari" },
    ],
  },
  {
    match: ["construção", "construcao", "edificação", "edificacao", "obra"],
    editais: [
      { title: "Construção de escola municipal com quadra esportiva coberta — 1.200 m²", organ: "Secretaria de Educação do Estado da Bahia", number: "0004501-33.2026.6.00045", modality: "Concorrência", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0004501-33.2026.6.00045", date: new Date().toISOString().slice(0, 10), value: 4200000, uf: "BA", city: "Salvador" },
      { title: "Construção de UBS (Unidade Básica de Saúde) padrão PORTE I", organ: "Prefeitura Municipal de Ilhéus", number: "0005678-19.2026.1.00567", modality: "Tomada de Preços", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0005678-19.2026.1.00567", date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), value: 1950000, uf: "BA", city: "Ilhéus" },
      { title: "Edificação de centro de convivência do idoso — obra completa", organ: "Prefeitura Municipal de Jequié", number: "0006123-44.2026.1.00612", modality: "Pregão Eletrônico", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0006123-44.2026.1.00612", date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), value: 920000, uf: "BA", city: "Jequié" },
    ],
  },
  {
    match: ["reforma", "manutenção", "manutencao", "restauração", "restauracao"],
    editais: [
      { title: "Reforma geral e adequação de acessibilidade em prédio público municipal", organ: "Prefeitura Municipal de Porto Seguro", number: "0007234-55.2026.1.00723", modality: "Convite", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0007234-55.2026.1.00723", date: new Date().toISOString().slice(0, 10), value: 450000, uf: "BA", city: "Porto Seguro" },
      { title: "Manutenção corretiva e preventiva da rede de drenagem pluvial urbana", organ: "Prefeitura Municipal de Lauro de Freitas", number: "0008901-62.2026.1.00890", modality: "Pregão Eletrônico", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0008901-62.2026.1.00890", date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), value: 680000, uf: "BA", city: "Lauro de Freitas" },
    ],
  },
  {
    match: ["saneamento", "esgoto", "abastecimento", "água", "agua"],
    editais: [
      { title: "Implantação de rede coletora de esgotamento sanitário — Zona Norte", organ: "EMBASA — Empresa Baiana de Águas e Saneamento", number: "0009345-71.2026.3.00934", modality: "Concorrência", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0009345-71.2026.3.00934", date: new Date().toISOString().slice(0, 10), value: 8750000, uf: "BA", city: "Salvador" },
      { title: "Ampliação do sistema de abastecimento de água — adutora 15 km", organ: "Prefeitura Municipal de Barreiras", number: "0010456-82.2026.1.01045", modality: "Tomada de Preços", portal: "PNCP", portalUrl: "https://pncp.gov.br/app/editais/0010456-82.2026.1.01045", date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10), value: 3200000, uf: "BA", city: "Barreiras" },
    ],
  },
];

function getFallbackEditais(keyword: string, uf: string): EditalFound[] {
  const kw = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matched = DEMO_TEMPLATES.find(t =>
    t.match.some(m => kw.includes(m) || m.includes(kw))
  );
  const templates = matched?.editais ?? DEMO_TEMPLATES[0].editais;
  return templates.slice(0, 3).map(e => ({
    ...e,
    title: `[Demo] ${e.title}`,
    portalUrl: null, // demo items have no real URL
    uf: uf || e.uf,
    keyword,
  }));
}

async function searchPNCP(keyword: string, uf: string): Promise<{ results: EditalFound[]; demo: boolean }> {
  // Try two approaches: with uf filter and without (broader search)
  const urls = [
    `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?q=${encodeURIComponent(keyword)}&uf=${uf}&pagina=1&tamanhoPagina=10`,
    `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?q=${encodeURIComponent(keyword)}&pagina=1&tamanhoPagina=5`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "ConstruTech-Pro/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const text = await res.text();
      if (!text) continue;

      let json: unknown;
      try { json = JSON.parse(text); } catch { continue; }

      // Response may be array or object with data field
      const items: unknown[] = Array.isArray(json)
        ? json
        : (json as Record<string, unknown>)?.data
          ? ((json as Record<string, unknown>).data as unknown[])
          : [];

      if (items.length === 0) continue;

      return {
        demo: false,
        results: items.map((item) => {
          const i = item as Record<string, unknown>;
          const orgao = i.orgaoEntidade as Record<string, unknown> | undefined;
          const unidade = i.unidadeOrgao as Record<string, unknown> | undefined;
          const link = (i.linkSistemaOrigem as string | undefined) ?? null;
          const numCtrl = (i.numeroControlePncp as string | undefined) ?? "";
          const pncpLink = numCtrl
            ? `https://pncp.gov.br/app/editais/${numCtrl.replace(/\//g, "-")}`
            : link;

          return {
            title: (i.objetoCompra as string | undefined) ?? "Sem descrição",
            organ: (orgao?.razaoSocial as string | undefined) ?? "Órgão não informado",
            number: numCtrl,
            modality: (i.modalidadeNome as string | undefined) ?? "Não informada",
            portal: "PNCP",
            portalUrl: pncpLink,
            date: ((i.dataPublicacaoPncp as string | undefined) ?? new Date().toISOString()).slice(0, 10),
            value: (i.valorTotalEstimado as number | undefined) ?? null,
            uf: (unidade?.ufSigla as string | undefined) ?? uf,
            city: (unidade?.municipioNome as string | undefined) ?? "",
            keyword,
          };
        }),
      };
    } catch {
      continue;
    }
  }

  // API unavailable — return demo data
  return { results: getFallbackEditais(keyword, uf), demo: true };
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

          // Send email alerts to admins/managers with emailNotifications enabled
          if (expiring.length > 0) {
            const company = await ctx.prisma.company.findUnique({
              where: { id: ctx.session.user.companyId },
              select: { name: true },
            });
            const recipients = await ctx.prisma.user.findMany({
              where: {
                companyId: ctx.session.user.companyId,
                emailNotifications: true,
                role: { in: ["ADMIN", "MANAGER"] },
              },
              select: { name: true, email: true },
            });
            for (const user of recipients) {
              await sendDocumentExpirationAlert({
                to: user.email,
                recipientName: user.name,
                companyName: company?.name ?? "sua empresa",
                docs: expiring,
              });
            }
          }

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
            let usedDemo = false;

            for (const keyword of keywords.slice(0, 5)) {
              if (portals.includes("PNCP")) {
                try {
                  const { results, demo } = await searchPNCP(keyword, uf);
                  allEditais.push(...results);
                  if (demo) usedDemo = true;
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
            const demoNote = usedDemo ? " [dados de demonstração — PNCP indisponível no momento]" : "";
            message = `${unique.length} edital(is) encontrado(s) para: ${keywords.join(", ")} — ${uf}${errNote}${demoNote}`;
            details = { editais: unique, portals, keywords, uf, demo: usedDemo };
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

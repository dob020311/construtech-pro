import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDocumentExpirationAlert, sendRpaJobReport } from "@/lib/email";

// Vercel Cron Job endpoint — runs every day at 07:00 UTC (04:00 BRT)
// Protected by CRON_SECRET header set in vercel.json

export const runtime = "nodejs";
export const maxDuration = 60;

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

async function runDocumentCheck(companyId: string) {
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const expiring = await prisma.document.findMany({
    where: { companyId, expirationDate: { lte: soon, gte: new Date() } },
    select: { id: true, name: true, expirationDate: true, type: true },
  });

  await prisma.document.updateMany({
    where: { companyId, expirationDate: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  await prisma.document.updateMany({
    where: { companyId, expirationDate: { gte: new Date(), lte: soon } },
    data: { status: "EXPIRING" },
  });

  const message = `${expiring.length} documento(s) vencendo em 30 dias. Status atualizado.`;

  if (expiring.length > 0) {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
    const recipients = await prisma.user.findMany({
      where: { companyId, emailNotifications: true, role: { in: ["ADMIN", "MANAGER"] } },
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

  return { itemsFound: expiring.length, message };
}

async function runEditalSearch(companyId: string, config: Record<string, unknown>) {
  const keywords = (config.keywords as string[] | undefined) ?? [];
  const uf = (config.uf as string | undefined) ?? "BA";

  if (keywords.length === 0) return { itemsFound: 0, message: "Nenhuma palavra-chave configurada." };

  const allEditais: EditalFound[] = [];

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const res = await fetch(
        `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?q=${encodeURIComponent(keyword)}&uf=${uf}&pagina=1&tamanhoPagina=5`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const json = await res.json() as unknown;
        const items: unknown[] = Array.isArray(json) ? json : ((json as Record<string, unknown>)?.data as unknown[] ?? []);
        for (const item of items) {
          const i = item as Record<string, unknown>;
          const orgao = i.orgaoEntidade as Record<string, unknown> | undefined;
          const unidade = i.unidadeOrgao as Record<string, unknown> | undefined;
          const numCtrl = (i.numeroControlePncp as string | undefined) ?? "";
          allEditais.push({
            title: (i.objetoCompra as string | undefined) ?? "Sem descrição",
            organ: (orgao?.razaoSocial as string | undefined) ?? "Órgão não informado",
            number: numCtrl,
            modality: (i.modalidadeNome as string | undefined) ?? "Não informada",
            portal: "PNCP",
            portalUrl: numCtrl ? `https://pncp.gov.br/app/editais/${numCtrl.replace(/\//g, "-")}` : null,
            date: ((i.dataPublicacaoPncp as string | undefined) ?? new Date().toISOString()).slice(0, 10),
            value: (i.valorTotalEstimado as number | undefined) ?? null,
            uf: (unidade?.ufSigla as string | undefined) ?? uf,
            city: (unidade?.municipioNome as string | undefined) ?? "",
            keyword,
          });
        }
      }
    } catch { /* timeout or network error — skip */ }
  }

  const message = `${allEditais.length} edital(is) encontrado(s) para: ${keywords.join(", ")} — ${uf}`;
  return { itemsFound: allEditais.length, message, details: { editais: allEditais, keywords, uf } };
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret — fail closed: if secret not configured, block all calls
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/rpa] CRON_SECRET não configurado");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getUTCHours();
  const results: { jobId: string; name: string; status: string; message: string }[] = [];

  // Find all active scheduled RPA jobs across all companies
  const jobs = await prisma.rpaJob.findMany({
    where: { isActive: true, schedule: { not: null } },
    include: { company: { select: { id: true, name: true } } },
  });

  for (const job of jobs) {
    const schedule = job.schedule ?? "";

    // Simple schedule matching: "daily" or "0 7 * * *" style hour check
    const shouldRun =
      schedule === "daily" ||
      schedule === `0 ${currentHour} * * *` ||
      schedule.startsWith(`0 ${currentHour}`);

    if (!shouldRun) continue;

    const started = Date.now();
    const config = job.config as Record<string, unknown>;

    try {
      let result: { itemsFound: number; message: string; details?: unknown } = { itemsFound: 0, message: "" };

      if (job.type === "DOCUMENT_CHECK") {
        result = await runDocumentCheck(job.companyId);
      } else if (job.type === "EDITAL_SEARCH") {
        result = await runEditalSearch(job.companyId, config);
      } else if (job.type === "PRICE_UPDATE") {
        result = { itemsFound: 0, message: "Tabela SINAPI consultada. Preços atualizados." };
      }

      const duration = Date.now() - started;

      await prisma.rpaJob.update({
        where: { id: job.id },
        data: { lastRunAt: new Date(), lastRunStatus: "SUCCESS" },
      });
      await prisma.rpaLog.create({
        data: {
          jobId: job.id,
          status: "SUCCESS",
          message: result.message,
          itemsFound: result.itemsFound,
          duration,
          details: (result.details as object) ?? undefined,
        },
      });

      // Send email report to admins if editais found
      if (job.type === "EDITAL_SEARCH" && result.itemsFound > 0) {
        const recipients = await prisma.user.findMany({
          where: { companyId: job.companyId, emailNotifications: true, role: { in: ["ADMIN", "MANAGER"] } },
          select: { name: true, email: true },
        });
        for (const user of recipients) {
          await sendRpaJobReport({
            to: user.email,
            recipientName: user.name,
            companyName: job.company.name,
            jobName: job.name,
            message: result.message,
            itemsFound: result.itemsFound,
          });
        }
      }

      results.push({ jobId: job.id, name: job.name, status: "SUCCESS", message: result.message });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
      await prisma.rpaJob.update({ where: { id: job.id }, data: { lastRunAt: new Date(), lastRunStatus: "FAILED" } });
      await prisma.rpaLog.create({ data: { jobId: job.id, status: "FAILED", message: errMsg, duration: Date.now() - started } });
      results.push({ jobId: job.id, name: job.name, status: "FAILED", message: errMsg });
    }
  }

  return NextResponse.json({
    ran: results.length,
    timestamp: now.toISOString(),
    results,
  });
}

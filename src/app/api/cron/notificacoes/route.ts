import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDocumentExpirationAlert, type ExpiringDoc } from "@/lib/email";

// Vercel Cron Job — runs daily at 08:00 UTC (05:00 BRT)
// vercel.json: { "crons": [{ "path": "/api/cron/notificacoes", "schedule": "0 8 * * *" }] }

export const runtime = "nodejs";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

async function upsertNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.notification.findFirst({
    where: { userId, type, title, createdAt: { gte: today } },
  });
  if (existing) return false;
  await prisma.notification.create({
    data: { userId, type, title, message, actionUrl },
  });
  return true;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let created = 0;

  // ── 1. Licitações com closingDate próximo ──
  const licitacoes = await prisma.licitacao.findMany({
    where: {
      closingDate: { gte: now, lte: in7Days },
      status: { in: ["IDENTIFIED", "ANALYZING", "GO", "BUDGETING", "PROPOSAL_SENT"] },
    },
    include: {
      company: {
        include: { users: { select: { id: true } } },
      },
    },
  });

  for (const lic of licitacoes) {
    const deadline = new Date(lic.closingDate!);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgency = diffDays <= 1 ? "🚨" : diffDays <= 3 ? "⚠️" : "📅";
    const daysText = diffDays <= 1 ? "hoje" : `${diffDays} dias`;

    for (const user of lic.company.users) {
      const ok = await upsertNotification(
        user.id,
        "licitacao_deadline",
        `${urgency} Prazo: ${lic.number}`,
        `Licitação ${lic.number} — ${lic.object.slice(0, 60)} encerra em ${daysText} (${deadline.toLocaleDateString("pt-BR")})`,
        `/licitacoes/${lic.id}`
      );
      if (ok) created++;
    }
  }

  // ── 2. Documentos vencendo em 7 dias ──
  const docsVencendo = await prisma.document.findMany({
    where: { expirationDate: { gte: now, lte: in7Days } },
    include: {
      company: {
        include: { users: { select: { id: true } } },
      },
    },
  });

  for (const doc of docsVencendo) {
    const expires = new Date(doc.expirationDate!);
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgency = diffDays <= 1 ? "🚨" : diffDays <= 3 ? "⚠️" : "📋";
    const label = doc.category ?? doc.type ?? "Documento";

    for (const user of doc.company.users) {
      const ok = await upsertNotification(
        user.id,
        "documento_vencendo",
        `${urgency} Documento vencendo: ${label}`,
        `"${label}" vence em ${diffDays <= 1 ? "hoje" : `${diffDays} dias`} — renove para não ser desclassificado`,
        `/documentos`
      );
      if (ok) created++;
    }
  }

  // ── 3. Documentos já vencidos ──
  const docsVencidos = await prisma.document.findMany({
    where: { expirationDate: { lt: now } },
    include: {
      company: {
        include: { users: { select: { id: true } } },
      },
    },
  });

  for (const doc of docsVencidos) {
    const label = doc.category ?? doc.type ?? "Documento";
    for (const user of doc.company.users) {
      const ok = await upsertNotification(
        user.id,
        "documento_vencido",
        `❌ Documento vencido: ${label}`,
        `"${label}" está vencido desde ${new Date(doc.expirationDate!).toLocaleDateString("pt-BR")}. Renove imediatamente.`,
        `/documentos`
      );
      if (ok) created++;
    }
  }

  // ── 4. Orçamentos sem atualização há 30 dias ──
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const orcParados = await prisma.orcamento.findMany({
    where: {
      updatedAt: { lt: thirtyDaysAgo },
      status: { in: ["DRAFT", "REVIEW"] },
      totalValue: { gt: 0 },
    },
    include: {
      company: {
        include: {
          users: { select: { id: true }, where: { role: { in: ["ADMIN", "MANAGER"] } } },
        },
      },
    },
  });

  for (const orc of orcParados) {
    for (const user of orc.company.users) {
      const ok = await upsertNotification(
        user.id,
        "orcamento_parado",
        `⏸ Orçamento parado: ${orc.name}`,
        `O orçamento "${orc.name}" não foi atualizado há mais de 30 dias. Verifique se ainda está em andamento.`,
        `/orcamentos/${orc.id}`
      );
      if (ok) created++;
    }
  }

  // ── 5. Enviar e-mails para usuários com emailNotifications = true ──
  let emailsSent = 0;

  // Agrupa documentos vencendo/vencidos por empresa
  const allDocsWithIssues = [...docsVencendo, ...docsVencidos];

  if (allDocsWithIssues.length > 0) {
    // Busca admins de cada empresa afetada com emailNotifications ativo
    const affectedCompanyIds = Array.from(new Set(allDocsWithIssues.map(d => d.companyId)));

    for (const companyId of affectedCompanyIds) {
      const admins = await prisma.user.findMany({
        where: {
          companyId,
          role: { in: ["ADMIN", "MANAGER"] },
          emailNotifications: true,
        },
        select: { email: true, name: true, company: { select: { name: true } } },
      });

      const companyDocs = allDocsWithIssues
        .filter(d => d.companyId === companyId)
        .map((d): ExpiringDoc => ({
          id: d.id,
          name: d.name,
          type: d.type as string,
          expirationDate: d.expirationDate,
        }));

      for (const admin of admins) {
        const result = await sendDocumentExpirationAlert({
          to: admin.email,
          recipientName: admin.name,
          companyName: admin.company.name,
          docs: companyDocs,
        });
        if (result.success) emailsSent++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    notificationsCreated: created,
    emailsSent,
    checked: {
      licitacoesDeadline: licitacoes.length,
      documentosVencendo: docsVencendo.length,
      documentosVencidos: docsVencidos.length,
      orcamentosParados: orcParados.length,
    },
  });
}

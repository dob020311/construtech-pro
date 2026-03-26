import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "ConstruTech Pro <noreply@construtech.pro>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://construtech-pro-xi.vercel.app";

/* ── Types ── */
export interface ExpiringDoc {
  id: string;
  name: string;
  type: string;
  expirationDate: Date | string | null;
}

/* ── Helpers ── */
function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusLabel(days: number | null): string {
  if (days === null) return "sem data";
  if (days <= 0) return "VENCIDO";
  if (days === 1) return "vence amanhã";
  return `vence em ${days} dias`;
}

const DOC_LABELS: Record<string, string> = {
  CERTIDAO_FEDERAL: "Certidão Federal",
  CERTIDAO_ESTADUAL: "Certidão Estadual",
  CERTIDAO_MUNICIPAL: "Certidão Municipal",
  CERTIDAO_TRABALHISTA: "Certidão Trabalhista",
  CERTIDAO_FGTS: "Certidão FGTS",
  CERTIDAO_NEGATIVA: "Certidão Negativa",
  REGISTRO_CREA: "Registro CREA",
  BALANCO_PATRIMONIAL: "Balanço Patrimonial",
  CONTRATO_SOCIAL: "Contrato Social",
  OUTROS: "Outros",
};

/* ── Email: documentos vencendo ── */
function buildExpirationHtml(
  recipientName: string,
  companyName: string,
  docs: ExpiringDoc[]
): string {
  const rows = docs
    .map((d) => {
      const days = daysUntil(d.expirationDate);
      const color = days !== null && days <= 0 ? "#dc2626" : days !== null && days <= 7 ? "#ea580c" : "#d97706";
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">
            ${d.name}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">
            ${DOC_LABELS[d.type] ?? d.type}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:${color};">
            ${statusLabel(days)}
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Alerta de Validade</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#1e3a5f;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ConstruTech Pro</h1>
          <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Sistema de Gestão de Licitações</p>
        </td></tr>

        <!-- Alert banner -->
        <tr><td style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 32px;">
          <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
            ⚠️ ${docs.length} documento(s) precisam de atenção
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Olá, <strong>${recipientName}</strong>.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
            Os seguintes documentos de <strong>${companyName}</strong> estão próximos do vencimento ou já vencidos.
            Renove-os o quanto antes para não perder prazos de habilitação em licitações.
          </p>

          <!-- Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Documento</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Tipo</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <!-- CTA -->
          <div style="margin-top:28px;text-align:center;">
            <a href="${APP_URL}/documentos/validades"
               style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
              Gerenciar Documentos
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            Você recebe este e-mail pois é administrador da empresa <strong>${companyName}</strong> no ConstruTech Pro.<br>
            Para ajustar notificações, acesse <a href="${APP_URL}/configuracoes" style="color:#3b82f6;">Configurações → Perfil</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Public functions ── */

export async function sendDocumentExpirationAlert(opts: {
  to: string;
  recipientName: string;
  companyName: string;
  docs: ExpiringDoc[];
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `⚠️ ${opts.docs.length} documento(s) vencendo — ${opts.companyName}`,
      html: buildExpirationHtml(opts.recipientName, opts.companyName, opts.docs),
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao enviar e-mail";
    console.error("[email] send error:", msg);
    return { success: false, error: msg };
  }
}

export async function sendRpaJobReport(opts: {
  to: string;
  recipientName: string;
  companyName: string;
  jobName: string;
  message: string;
  itemsFound: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "RESEND_API_KEY not configured" };

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Relatório RPA</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:#1e3a5f;padding:24px 28px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">ConstruTech Pro — Relatório de Agente</h1>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">Olá, <strong>${opts.recipientName}</strong>.</p>
          <p style="margin:0 0 20px;font-size:14px;color:#475569;">O agente <strong>${opts.jobName}</strong> foi executado com sucesso.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">✅ ${opts.itemsFound} item(ns) encontrado(s)</p>
            <p style="margin:6px 0 0;font-size:13px;color:#15803d;">${opts.message}</p>
          </div>
          <div style="margin-top:24px;text-align:center;">
            <a href="${APP_URL}/rpa" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;">Ver Agentes RPA</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            ${opts.companyName} · <a href="${APP_URL}/configuracoes" style="color:#3b82f6;">Gerenciar notificações</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `✅ Agente "${opts.jobName}" executado — ${opts.itemsFound} resultado(s)`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro" };
  }
}

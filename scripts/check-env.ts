/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas.
 * Rode antes do deploy: npx tsx scripts/check-env.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Carrega .env, .env.local ou .env.production dependendo do arg
const envFile = process.argv[2] ?? ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const REQUIRED = [
  { key: "DATABASE_URL",         group: "Banco de Dados" },
  { key: "DIRECT_URL",           group: "Banco de Dados" },
  { key: "AUTH_SECRET",          group: "Auth",           alt: "NEXTAUTH_SECRET" },
  { key: "NEXTAUTH_URL",         group: "Auth" },
  { key: "NEXT_PUBLIC_APP_URL",  group: "App" },
];

const OPTIONAL = [
  { key: "STRIPE_SECRET_KEY",      group: "Stripe (pagamentos)" },
  { key: "STRIPE_PUBLISHABLE_KEY", group: "Stripe (pagamentos)" },
  { key: "STRIPE_WEBHOOK_SECRET",  group: "Stripe (pagamentos)" },
  { key: "STRIPE_PRICE_STARTER",   group: "Stripe (pagamentos)" },
  { key: "STRIPE_PRICE_PRO",       group: "Stripe (pagamentos)" },
  { key: "RESEND_API_KEY",         group: "E-mail (Resend)" },
  { key: "EMAIL_FROM",             group: "E-mail (Resend)" },
  { key: "ANTHROPIC_API_KEY",      group: "IA (Anthropic)" },
  { key: "CRON_SECRET",            group: "Cron Jobs" },
  { key: "AWS_ACCESS_KEY_ID",      group: "S3/R2 (uploads)" },
  { key: "AWS_SECRET_ACCESS_KEY",  group: "S3/R2 (uploads)" },
  { key: "AWS_S3_BUCKET",          group: "S3/R2 (uploads)" },
  { key: "AWS_REGION",             group: "S3/R2 (uploads)" },
];

let hasError = false;

console.log(`\n🔍  Verificando variáveis de ambiente (${envFile})…\n`);

// Obrigatórias
const requiredGroups = [...new Set(REQUIRED.map(v => v.group))];
for (const group of requiredGroups) {
  const vars = REQUIRED.filter(v => v.group === group);
  for (const v of vars) {
    const value = process.env[v.key] ?? (v.alt ? process.env[v.alt] : undefined);
    if (!value) {
      console.error(`❌  [${group}] ${v.key}${v.alt ? ` (ou ${v.alt})` : ""} — AUSENTE`);
      hasError = true;
    } else {
      console.log(`✅  [${group}] ${v.key}`);
    }
  }
}

// Opcionais
console.log("\n📋  Opcionais (funcionalidades extras):");
const optionalGroups = [...new Set(OPTIONAL.map(v => v.group))];
for (const group of optionalGroups) {
  const vars = OPTIONAL.filter(v => v.group === group);
  const allSet = vars.every(v => !!process.env[v.key]);
  const anySet = vars.some(v => !!process.env[v.key]);

  if (allSet) {
    console.log(`✅  [${group}]`);
  } else if (anySet) {
    for (const v of vars) {
      if (!process.env[v.key]) {
        console.warn(`⚠️   [${group}] ${v.key} — ausente (módulo pode falhar)`);
      }
    }
  } else {
    console.log(`○   [${group}] — não configurado (desativado)`);
  }
}

if (hasError) {
  console.error("\n❌  Corrija as variáveis obrigatórias antes de fazer deploy.\n");
  process.exit(1);
} else {
  console.log("\n✅  Todas as variáveis obrigatórias estão definidas.\n");
}

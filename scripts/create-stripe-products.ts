/**
 * Script para criar produtos e preços no Stripe.
 * Execute UMA VEZ após configurar STRIPE_SECRET_KEY no .env.local:
 *
 *   npx tsx scripts/create-stripe-products.ts
 *
 * O script imprime os Price IDs — copie para STRIPE_PRICE_STARTER e STRIPE_PRICE_PRO.
 */

import Stripe from "stripe";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌  STRIPE_SECRET_KEY não encontrada em .env.local");
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  console.log("🔧  Criando produtos e preços no Stripe...\n");

  // ── Starter ──────────────────────────────────────────────────────────────
  const starter = await stripe.products.create({
    name: "ConstruTech Pro — Starter",
    description: "Até 50 licitações, 3 usuários, 5 agentes RPA, 200 documentos",
    metadata: { plan: "STARTER" },
  });

  const starterPrice = await stripe.prices.create({
    product: starter.id,
    unit_amount: 6900, // R$ 69,00
    currency: "brl",
    recurring: { interval: "month" },
    nickname: "Starter Mensal",
  });

  console.log(`✅  Starter criado`);
  console.log(`   Product ID : ${starter.id}`);
  console.log(`   Price ID   : ${starterPrice.id}`);
  console.log(`   → STRIPE_PRICE_STARTER="${starterPrice.id}"\n`);

  // ── Pro ──────────────────────────────────────────────────────────────────
  const pro = await stripe.products.create({
    name: "ConstruTech Pro — Pro",
    description: "Licitações ilimitadas, 10 usuários, 20 agentes RPA, documentos ilimitados",
    metadata: { plan: "PRO" },
  });

  const proPrice = await stripe.prices.create({
    product: pro.id,
    unit_amount: 9900, // R$ 99,00
    currency: "brl",
    recurring: { interval: "month" },
    nickname: "Pro Mensal",
  });

  console.log(`✅  Pro criado`);
  console.log(`   Product ID : ${pro.id}`);
  console.log(`   Price ID   : ${proPrice.id}`);
  console.log(`   → STRIPE_PRICE_PRO="${proPrice.id}"\n`);

  console.log("─".repeat(60));
  console.log("📋  Adicione ao seu .env.local e nas variáveis do Vercel:");
  console.log(`\nSTRIPE_PRICE_STARTER="${starterPrice.id}"`);
  console.log(`STRIPE_PRICE_PRO="${proPrice.id}"\n`);
}

main().catch((err) => {
  console.error("❌  Erro:", err);
  process.exit(1);
});

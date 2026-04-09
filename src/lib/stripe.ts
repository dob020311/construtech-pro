import Stripe from "stripe";

// Lazy init — avoids build-time errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLANS = {
  FREE: {
    id: "free",
    name: "Grátis",
    price: 0,
    priceId: null,
    limits: {
      licitacoes: 5,
      users: 1,
      rpaJobs: 1,
      documents: 20,
    },
    features: [
      "Até 5 licitações",
      "1 usuário",
      "1 agente RPA",
      "20 documentos",
      "Orçamentos ilimitados",
    ],
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    price: 6900, // R$ 69,00 em centavos
    priceId: process.env.STRIPE_PRICE_STARTER ?? null,
    limits: {
      licitacoes: 50,
      users: 3,
      rpaJobs: 5,
      documents: 200,
    },
    features: [
      "Até 50 licitações",
      "3 usuários",
      "5 agentes RPA",
      "200 documentos",
      "Orçamentos ilimitados",
      "Alertas por e-mail",
      "Exportação PDF/Excel",
    ],
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 9900, // R$ 99,00 em centavos
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    limits: {
      licitacoes: -1, // ilimitado
      users: 10,
      rpaJobs: 20,
      documents: -1,
    },
    features: [
      "Licitações ilimitadas",
      "Até 10 usuários",
      "20 agentes RPA",
      "Documentos ilimitados",
      "Análise IA de orçamentos",
      "Alertas por e-mail",
      "Exportação PDF/Excel",
      "Suporte prioritário",
    ],
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // sob consulta
    priceId: null,
    limits: {
      licitacoes: -1,
      users: -1,
      rpaJobs: -1,
      documents: -1,
    },
    features: [
      "Tudo do Pro",
      "Usuários ilimitados",
      "SSO / SAML",
      "SLA dedicado",
      "Integração personalizada",
      "Onboarding assistido",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function formatPrice(centavos: number): string {
  if (centavos < 0) return "Sob consulta";
  if (centavos === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, PLANS, PlanKey } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planKey } = await req.json() as { planKey: PlanKey };
  const plan = PLANS[planKey];

  if (!plan || !plan.priceId) {
    return NextResponse.json({ error: "Plano inválido ou não configurado" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { id: true, name: true, email: true, stripeCustomerId: true },
  });
  if (!company) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://construtech-pro-xi.vercel.app";

  // Create or retrieve Stripe customer
  let customerId = company.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      email: company.email ?? undefined,
      metadata: { companyId: company.id },
    });
    customerId = customer.id;
    await prisma.company.update({ where: { id: company.id }, data: { stripeCustomerId: customerId } });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${appUrl}/configuracoes?tab=billing&success=1`,
    cancel_url: `${appUrl}/configuracoes?tab=billing&canceled=1`,
    metadata: { companyId: company.id, planKey },
    subscription_data: {
      metadata: { companyId: company.id, planKey },
    },
    locale: "pt-BR",
  });

  return NextResponse.json({ url: checkoutSession.url });
}

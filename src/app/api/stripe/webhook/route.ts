import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err instanceof Error ? err.message : "unknown"}` }, { status: 400 });
  }

  const planKeyFromMetadata = (meta: Stripe.Metadata) => {
    const key = meta.planKey as string | undefined;
    return (["FREE", "STARTER", "PRO", "ENTERPRISE"].includes(key ?? "") ? key : "FREE") as
      "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.metadata?.companyId;
      const planKey = planKeyFromMetadata(session.metadata ?? {});
      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            plan: planKey,
            stripeSubscriptionId: session.subscription as string ?? null,
            stripePriceId: session.metadata?.priceId ?? null,
            planExpiresAt: null,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.companyId;
      const planKey = planKeyFromMetadata(sub.metadata ?? {});
      const active = sub.status === "active" || sub.status === "trialing";
      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            plan: active ? planKey : "FREE",
            stripeSubscriptionId: sub.id,
            planExpiresAt: active ? null : new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.companyId;
      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: { plan: "FREE", stripeSubscriptionId: null, stripePriceId: null, planExpiresAt: null },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const company = await prisma.company.findFirst({ where: { stripeCustomerId: customerId } });
      if (company) {
        await prisma.company.update({
          where: { id: company.id },
          data: { planExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days grace
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

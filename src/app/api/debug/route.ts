import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? "NOT SET";
  const masked = dbUrl.replace(/:([^:@]+)@/, ":***@").substring(0, 80);

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount, urlUsed: masked });
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      urlUsed: masked,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

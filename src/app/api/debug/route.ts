import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const user = await prisma.user.findUnique({
      where: { email: "admin@construtech.com" },
      select: { email: true, passwordHash: true },
    });
    return NextResponse.json({
      ok: true,
      userCount,
      adminFound: !!user,
      hashPrefix: user?.passwordHash?.substring(0, 10),
    });
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

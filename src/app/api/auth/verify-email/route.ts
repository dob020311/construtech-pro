import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const { token } = schema.parse(body);

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.json({ error: "Link inválido ou já utilizado." }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: record.identifier, emailVerified: null },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }
    console.error("[verify-email]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

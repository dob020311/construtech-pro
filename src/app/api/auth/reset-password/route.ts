import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const { token, password } = schema.parse(body);

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Token expirado. Solicite um novo link." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: record.identifier } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

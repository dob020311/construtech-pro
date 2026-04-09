import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerification } from "@/lib/email";

const schema = z.object({
  companyName: z.string().min(3),
  cnpj: z.string().min(14),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const data = schema.parse(body);

    // Check duplicate email
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    // Check duplicate CNPJ
    const cnpjExists = await prisma.company.findUnique({ where: { cnpj: data.cnpj } });
    if (cnpjExists) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create company + admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          cnpj: data.cnpj,
          phone: data.phone ?? null,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "ADMIN",
          companyId: company.id,
          // emailVerified is null until they click the link
        },
      });

      return { company, user };
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await prisma.verificationToken.create({ data: { identifier: data.email, token, expires } });
    void sendEmailVerification({ to: data.email, name: data.name, token });

    return NextResponse.json({ success: true, companyId: result.company.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}

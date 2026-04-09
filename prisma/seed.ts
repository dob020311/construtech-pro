import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Empresa demo (apenas para desenvolvimento/teste interno) ──────────────
  const company = await prisma.company.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: {
      name: "Empresa Demo",
      cnpj: "00.000.000/0001-00",
    },
  });

  console.log("✅ Empresa demo criada:", company.name);

  // ── Admin demo ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo123", 12);

  await prisma.user.upsert({
    where: { email: "admin@construtech.com" },
    update: { emailVerified: new Date() },
    create: {
      name: "Administrador",
      email: "admin@construtech.com",
      passwordHash,
      role: "ADMIN",
      companyId: company.id,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Usuário admin criado: admin@construtech.com / demo123");

  console.log("\n🎉 Seed concluído — sistema limpo e pronto para uso!");
  console.log("\n📋 Acesso demo (apenas desenvolvimento):");
  console.log("   Admin: admin@construtech.com / demo123");
  console.log("\n   Para uso real: cadastre sua empresa em /registro");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

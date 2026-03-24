import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) return NextResponse.json({ error: "Arquivo muito grande (máx 10 MB)" }, { status: 400 });

  const allowedTypes = [
    "application/pdf",
    "image/jpeg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes));

  return NextResponse.json({
    fileKey: `uploads/${fileName}`,
    fileUrl: `/uploads/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
}

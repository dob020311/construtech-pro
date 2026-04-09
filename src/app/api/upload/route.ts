import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isS3Configured, createPresignedUploadUrl } from "@/lib/s3";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * GET /api/upload?name=arquivo.pdf&type=application/pdf&folder=cde&size=12345
 * Retorna uma presigned URL para upload direto ao S3/R2 (quando S3 estiver configurado)
 * ou aceita POST multipart para upload local (desenvolvimento).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isS3Configured()) {
    return NextResponse.json({ error: "S3 não configurado. Use POST para upload local." }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type");
  const folder = searchParams.get("folder") ?? "uploads";
  const size = Number(searchParams.get("size") ?? 0);

  if (!name || !type) {
    return NextResponse.json({ error: "Parâmetros name e type são obrigatórios" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 50 MB)" }, { status: 400 });
  }

  const { uploadUrl, fileKey, fileUrl } = await createPresignedUploadUrl({
    mimeType: type,
    originalName: name,
    folder,
  });

  return NextResponse.json({ uploadUrl, fileKey, fileUrl, method: "PUT" });
}

/**
 * POST /api/upload (multipart/form-data)
 * Fallback para upload local em desenvolvimento (quando S3 não está configurado).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Em produção com S3 configurado, o upload deve ir direto via presigned URL (GET endpoint)
  if (isS3Configured()) {
    return NextResponse.json(
      { error: "Use GET /api/upload?name=...&type=...&folder=... para obter a presigned URL de upload." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 50 MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const folder = (formData.get("folder") as string | null) ?? "uploads";
  const fileName = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", folder);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes));

  return NextResponse.json({
    fileKey: `${folder}/${fileName}`,
    fileUrl: `/${folder}/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    method: "local",
  });
}

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION ?? "sa-east-1";
  const endpoint = process.env.AWS_S3_ENDPOINT; // Cloudflare R2 ou outro S3-compatible

  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = process.env.AWS_S3_BUCKET ?? "construtech-uploads";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL; // ex: https://cdn.construtech.pro

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
}

/**
 * Gera uma presigned URL para upload direto do browser para o S3/R2.
 * O arquivo é enviado via PUT direto para o bucket — sem passar pelo servidor.
 */
export async function createPresignedUploadUrl(opts: {
  mimeType: string;
  originalName: string;
  folder?: string; // ex: "cde", "documentos"
  maxSizeMB?: number;
}): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
  const s3 = getS3Client();
  const ext = opts.originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const folder = opts.folder ?? "uploads";
  const fileKey = `${folder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: opts.mimeType,
    // limita o tamanho via Content-Length (cliente deve respeitar)
    Metadata: {
      originalName: opts.originalName,
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  // URL pública do arquivo
  const fileUrl = CDN_URL
    ? `${CDN_URL}/${fileKey}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "sa-east-1"}.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, fileUrl };
}

/**
 * Gera uma presigned URL para download privado (para arquivos não públicos).
 */
export async function createPresignedDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Remove um arquivo do S3/R2.
 */
export async function deleteS3File(fileKey: string): Promise<void> {
  if (!fileKey || fileKey.startsWith("uploads/") === false && fileKey.startsWith("cde/") === false) {
    return; // não deleta arquivos locais ou chaves inválidas
  }
  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
}

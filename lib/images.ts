import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";

export const IMAGE_LIMITS = {
  /** 브라우저에서 WebP로 줄인 뒤 올리므로 보통 수백 KB입니다. */
  maxBytes: 3 * 1024 * 1024,
  types: ["image/webp", "image/jpeg", "image/png", "image/gif"],
} as const;

export const mediaUrl = (id: number) => `/media/${id}`;

export async function saveImage(input: {
  data: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  originalName?: string;
}): Promise<{ id: number; url: string }> {
  const [row] = await db
    .insert(images)
    .values({
      data: input.data,
      mimeType: input.mimeType,
      byteSize: input.data.length,
      width: input.width ?? null,
      height: input.height ?? null,
      originalName: input.originalName?.slice(0, 200) ?? null,
    })
    .returning({ id: images.id });
  return { id: row.id, url: mediaUrl(row.id) };
}

export async function getImage(id: number) {
  const [row] = await db
    .select({ data: images.data, mimeType: images.mimeType })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  return row ?? null;
}

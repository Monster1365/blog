"use client";

import { uploadImage } from "@/app/admin/actions";

export const IMAGE_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type ShrinkOptions = {
  /** 이보다 크면 줄입니다 (px) */
  maxWidth?: number;
  /** 결과 형식. 파비콘처럼 투명 배경이 필요하면 image/png */
  type?: "image/webp" | "image/png";
  quality?: number;
};

/** 브라우저에서 이미지를 줄이고 형식을 바꿉니다. (GIF 애니메이션은 첫 장면만 남습니다) */
export async function shrinkImage(
  file: File,
  { maxWidth = 1600, type = "image/webp", quality = 0.85 }: ShrinkOptions = {},
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // 원하는 형식으로 못 만드는 브라우저면 원본을 그대로 올립니다.
  return blob && blob.type === type ? { blob, width, height } : { blob: file, width, height };
}

/** 이미지 파일을 줄여서 /media 에 올리고 주소를 돌려줍니다. */
export async function uploadImageFile(
  file: File,
  options?: ShrinkOptions,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!IMAGE_ACCEPT.includes(file.type)) {
    return { ok: false, message: "JPG, PNG, WebP, GIF 이미지만 올릴 수 있습니다." };
  }
  try {
    const { blob, width, height } = await shrinkImage(file, options);
    const ext = blob.type === "image/webp" ? ".webp" : blob.type === "image/png" ? ".png" : "";
    const form = new FormData();
    form.set("file", blob, file.name.replace(/\.\w+$/, "") + ext);
    form.set("width", String(width));
    form.set("height", String(height));
    form.set("originalName", file.name);
    return await uploadImage(form);
  } catch {
    return { ok: false, message: "이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요." };
  }
}

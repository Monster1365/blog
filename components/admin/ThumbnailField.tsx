"use client";

import Image from "next/image";
import { type DragEvent, useRef, useState, useTransition } from "react";
import { uploadImage } from "@/app/admin/actions";
import { featuredImageSrc } from "@/lib/format";

const MAX_WIDTH = 1600;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 브라우저에서 이미지를 최대 1600px WebP로 줄입니다. (GIF 애니메이션은 첫 장면만 남습니다) */
async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  // WebP로 못 만드는 브라우저면 원본을 그대로 올립니다.
  return blob && blob.type === "image/webp" ? { blob, width, height } : { blob: file, width, height };
}

/**
 * 썸네일(대표 이미지) 칸: 끌어다 놓기 / 클릭해서 고르기 / 직접 경로 입력.
 * 값은 name="featuredImg" 입력으로 폼과 함께 저장됩니다.
 */
export default function ThumbnailField({
  defaultValue,
  error,
}: {
  defaultValue: string;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setMessage("JPG, PNG, WebP, GIF 이미지만 올릴 수 있습니다.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const { blob, width, height } = await shrink(file);
        const form = new FormData();
        form.set("file", blob, file.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ""));
        form.set("width", String(width));
        form.set("height", String(height));
        form.set("originalName", file.name);
        const result = await uploadImage(form);
        if (result.ok) setValue(result.url);
        else setMessage(result.message);
      } catch {
        setMessage("이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.");
      }
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  }

  const shownError = message ?? error;

  return (
    <div className={`admin-field${shownError ? " --error" : ""}`}>
      <label htmlFor="featuredImg">썸네일 (대표 이미지)</label>
      <input type="hidden" name="featuredImg" value={value} />

      <div
        className={`thumb-drop${dragging ? " --dragging" : ""}${value ? " --has-image" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="썸네일 이미지 올리기. 이미지를 끌어다 놓거나 눌러서 고르세요."
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={pending}
      >
        {value ? (
          <Image
            src={featuredImageSrc(value)}
            alt="현재 썸네일"
            fill
            sizes="(min-width: 48em) 480px, 100vw"
            className="thumb-drop__image"
          />
        ) : null}
        <span className="thumb-drop__hint">
          {pending
            ? "올리는 중…"
            : value
              ? "다른 이미지를 끌어다 놓거나 눌러서 바꾸기"
              : "이미지를 여기로 끌어다 놓거나 눌러서 고르세요"}
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="thumb-drop__row">
        <input
          id="featuredImg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="또는 경로 직접 입력 (예: sleek, /media/3)"
          aria-describedby="featuredImg-hint"
        />
        {value && (
          <button type="button" className="admin-btn" onClick={() => setValue("")}>
            빼기
          </button>
        )}
      </div>
      {shownError ? (
        <span className="admin-field__error">{shownError}</span>
      ) : (
        <span id="featuredImg-hint" className="admin-field__hint">
          올린 이미지는 1600px 이하 WebP로 줄여서 DB에 저장됩니다.
        </span>
      )}
    </div>
  );
}

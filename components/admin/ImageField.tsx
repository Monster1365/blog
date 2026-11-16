"use client";

import Image from "next/image";
import { type DragEvent, useRef, useState, useTransition } from "react";
import { IMAGE_ACCEPT, type ShrinkOptions, uploadImageFile } from "@/lib/client-image";
import { featuredImageSrc } from "@/lib/format";

/**
 * 이미지 칸: 끌어다 놓기 / 클릭해서 고르기 / 직접 경로 입력.
 * 값은 name 입력으로 폼과 함께 저장됩니다. (썸네일, 배너 이미지, 파비콘에 사용)
 */
export default function ImageField({
  name,
  label,
  defaultValue,
  error,
  hint = "올린 이미지는 1600px 이하 WebP로 줄여서 DB에 저장됩니다.",
  placeholder = "또는 경로 직접 입력 (예: sleek, /media/3)",
  aspect = "16 / 9",
  shrink,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  /** 미리 보기 칸 비율 (예: "16 / 9", "1 / 1") */
  aspect?: string;
  shrink?: ShrinkOptions;
}) {
  const [value, setValue] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = `${name}-path`;

  function upload(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      const result = await uploadImageFile(file, shrink);
      if (result.ok) setValue(result.url);
      else setMessage(result.message);
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
      <label htmlFor={inputId}>{label}</label>
      <input type="hidden" name={name} value={value} />

      <div
        className={`thumb-drop${dragging ? " --dragging" : ""}${value ? " --has-image" : ""}${aspect === "1 / 1" ? " --square" : ""}`}
        style={{ aspectRatio: aspect }}
        role="button"
        tabIndex={0}
        aria-label={`${label} 올리기. 이미지를 끌어다 놓거나 눌러서 고르세요.`}
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
            alt={`현재 ${label}`}
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
        accept={IMAGE_ACCEPT.join(",")}
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="thumb-drop__row">
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-describedby={`${inputId}-hint`}
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
        <span id={`${inputId}-hint`} className="admin-field__hint">
          {hint}
        </span>
      )}
    </div>
  );
}

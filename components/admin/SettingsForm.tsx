"use client";

import { type ReactNode, useActionState } from "react";
import { type SettingsFormState, saveSettings } from "@/app/admin/actions";
import ImageField from "@/components/admin/ImageField";
import MarkdownEditor from "@/components/admin/MarkdownEditor";

export type SettingsValues = NonNullable<SettingsFormState["values"]>;

const initialState: SettingsFormState = { status: "idle" };

/** 관리 페이지 > 사이트 설정 폼. 빈 칸은 기본값(defaults)을 씁니다. */
export default function SettingsForm({
  saved,
  defaults,
}: {
  saved: SettingsValues;
  defaults: SettingsValues;
}) {
  const [state, formAction, pending] = useActionState(saveSettings, initialState);
  const v = state.values ?? saved;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="admin-form" key={state.nonce ?? "initial"}>
      <fieldset className="admin-fieldset">
        <legend>블로그 이름</legend>
        <div className="admin-form__row">
          <Field id="title" label="이름" hint={`탭 제목·홈 배너·메일 제목에 쓰입니다. 기본값: ${defaults.title}`} error={errors.title}>
            <input id="title" name="title" defaultValue={v.title} placeholder={defaults.title} maxLength={60} />
          </Field>
          <Field id="shortTitle" label="짧은 이름 (로고)" hint={`헤더 왼쪽 로고에 쓰입니다. 기본값: ${defaults.shortTitle}`} error={errors.shortTitle}>
            <input id="shortTitle" name="shortTitle" defaultValue={v.shortTitle} placeholder={defaults.shortTitle} maxLength={20} />
          </Field>
        </div>
        <Field id="description" label="설명" hint="검색 결과와 링크 미리보기에 나오는 소개입니다." error={errors.description}>
          <textarea id="description" name="description" rows={2} defaultValue={v.description} placeholder={defaults.description} maxLength={300} />
        </Field>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>홈 배너</legend>
        <div className="admin-form__row">
          <ImageField
            name="heroImage"
            label="배너 이미지"
            defaultValue={v.heroImage}
            error={errors.heroImage}
            hint="홈 맨 위 큰 배경 이미지입니다. 2400px 이하 WebP로 줄여서 저장됩니다."
            shrink={{ maxWidth: 2400 }}
          />
          <Field id="tagline" label="배너 소개글" hint="배너 안쪽, 블로그 이름 아래에 나오는 문장입니다." error={errors.tagline}>
            <textarea id="tagline" name="tagline" rows={4} defaultValue={v.tagline} placeholder={defaults.tagline} maxLength={200} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>파비콘</legend>
        <div className="admin-form__row">
          <ImageField
            name="favicon"
            label="파비콘 (탭 아이콘)"
            defaultValue={v.favicon}
            error={errors.favicon}
            aspect="1 / 1"
            placeholder="비우면 기본 아이콘"
            hint="정사각형 이미지를 권장합니다. 256px PNG로 줄여서 저장됩니다."
            shrink={{ maxWidth: 256, type: "image/png" }}
          />
          <p className="admin-help">
            브라우저가 파비콘을 오래 저장해 두기 때문에, 바꾼 뒤 탭 아이콘이 바로 안 바뀌면 새로고침(⌘⇧R)해 보세요.
          </p>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>About 페이지</legend>
        <MarkdownEditor
          id="about"
          name="about"
          label="About 본문 (Markdown)"
          defaultValue={v.about || defaults.about}
          rows={18}
          error={errors.about}
          placeholder="About 페이지에 보일 소개를 Markdown으로 쓰세요."
        />
      </fieldset>

      <div className="admin-form__actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
        {state.message && (
          <p className={`contact-form__status --${state.status}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`admin-field${error ? " --error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="admin-field__error">{error}</span>
      ) : (
        hint && <span className="admin-field__hint">{hint}</span>
      )}
    </div>
  );
}

"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { type ContactState, sendContactMessage } from "@/app/contact/actions";

const initialState: ContactState = { status: "idle" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 페이지를 연 시각 (너무 빨리 제출하는 봇 걸러내기)
  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  // 보내기에 성공하면 입력칸을 비웁니다.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form ref={formRef} action={formAction} className="contact-form" noValidate>
      <div className="contact-form__row">
        <Field id="name" label="이름" error={errors.name}>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
            defaultValue={values?.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>
        <Field id="email" label="이메일" error={errors.email}>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
            defaultValue={values?.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
      </div>

      <Field id="message" label="메시지" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={7}
          maxLength={5000}
          required
          defaultValue={values?.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
      </Field>

      {/* 스팸 방지용. 사람에게는 보이지 않습니다. */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedAtRef} type="hidden" name="startedAt" />

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "보내는 중…" : "보내기"}
      </button>

      <p
        className={`contact-form__status${state.status === "idle" ? "" : ` --${state.status}`}`}
        role="status"
        aria-live="polite"
      >
        {state.message}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`form__input${error ? " error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span id={`${id}-error`} className="error-data">
          {error}
        </span>
      )}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { type CommentState, addComment } from "@/app/[slug]/actions";

const initialState: CommentState = { status: "idle" };

export default function CommentForm({ postId }: { postId: number }) {
  const [state, formAction, pending] = useActionState(addComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  // 등록에 성공하면 입력칸을 비웁니다.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.submittedAt, state.status]);

  return (
    <form ref={formRef} action={formAction} className="comment-form" noValidate>
      <input type="hidden" name="postId" value={postId} />
      <div className="form__input">
        <label htmlFor="comment-body">댓글 쓰기</label>
        <textarea
          id="comment-body"
          name="body"
          rows={4}
          maxLength={2000}
          required
          placeholder="익명으로 등록됩니다. 같은 글 안에서는 같은 익명 번호가 붙습니다."
          defaultValue={state.status === "error" ? state.body : undefined}
          key={state.submittedAt ?? "initial"}
        />
      </div>

      {/* 스팸 방지용. 사람에게는 보이지 않습니다. */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="comment-website">Website</label>
        <input type="text" id="comment-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedAtRef} type="hidden" name="startedAt" />

      <div className="comment-form__footer">
        <p
          className={`contact-form__status${state.status === "error" ? " --error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {state.status === "error" ? state.message : ""}
        </p>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}

"use client";

import {
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
  useTransition,
} from "react";
import { previewMarkdown } from "@/app/admin/actions";
import { IMAGE_ACCEPT, uploadImageFile } from "@/lib/client-image";
import { type FrontMatter, parseFrontMatter } from "@/lib/frontmatter";
import * as md from "@/lib/markdown-edit";

const MARKDOWN_ACCEPT = ".md,.markdown,.mdx,.txt,text/markdown,text/plain";
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

type Tool = {
  id: string;
  label: string;
  /** 버튼에 보일 모양 */
  icon: ReactNode;
  shortcut?: string;
  run: (value: string, s: number, e: number) => md.MarkdownEdit;
};

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/** 도구 모음 (빈 항목은 구분선) */
const TOOLS: (Tool | null)[] = [
  { id: "h2", label: "제목 2", icon: <b>H2</b>, run: (v, s, e) => md.heading(v, s, e, 2) },
  { id: "h3", label: "제목 3", icon: <b>H3</b>, run: (v, s, e) => md.heading(v, s, e, 3) },
  null,
  { id: "bold", label: "굵게", icon: <b>B</b>, shortcut: "B", run: (v, s, e) => md.wrap(v, s, e, "**", "**", "굵은 글자") },
  { id: "italic", label: "기울임", icon: <i style={{ fontFamily: "Georgia, serif" }}>I</i>, shortcut: "I", run: (v, s, e) => md.wrap(v, s, e, "*", "*", "기울인 글자") },
  { id: "strike", label: "취소선", icon: <s>S</s>, run: (v, s, e) => md.wrap(v, s, e, "~~", "~~", "취소할 글자") },
  { id: "code", label: "코드", icon: <code>{"<>"}</code>, shortcut: "E", run: (v, s, e) => md.wrap(v, s, e, "`", "`", "code") },
  null,
  { id: "link", label: "링크", icon: <I d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 014.5 9l1-1" />, shortcut: "K", run: md.link },
  { id: "quote", label: "인용", icon: <I d="M3 4v8M6 5h7M6 8h7M6 11h5" />, run: (v, s, e) => md.toggleLinePrefix(v, s, e, "> ", /^> /) },
  { id: "codeblock", label: "코드 블록", icon: <I d="M5 4L1.5 8 5 12M11 4l3.5 4-3.5 4M9.5 3l-3 10" />, run: md.codeBlock },
  null,
  { id: "ul", label: "글머리 목록", icon: <I d="M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />, run: (v, s, e) => md.toggleLinePrefix(v, s, e, "- ", /^[-*+] (?!\[[ x]\] )/) },
  { id: "ol", label: "번호 목록", icon: <I d="M7 4h7M7 8h7M7 12h7M2 3.5h1.5V6.5M2 6.5h2.5M2 9.5h2l-2 3h2.5" />, run: (v, s, e) => md.toggleLinePrefix(v, s, e, (i) => `${i + 1}. `, /^\d+\. /) },
  { id: "task", label: "체크리스트", icon: <I d="M2 3h4v4H2zM3 5l1 1 1.5-2M8 5h6M2 10h4v4H2zM8 12h6" />, run: (v, s, e) => md.toggleLinePrefix(v, s, e, "- [ ] ", /^[-*+] \[[ x]\] /) },
  null,
  { id: "table", label: "표", icon: <I d="M2 3h12v10H2zM2 6.5h12M2 10h12M6.5 3v10" />, run: md.table },
  { id: "hr", label: "구분선", icon: <I d="M2 8h12" />, run: md.horizontalRule },
];

/**
 * 마크다운 본문 편집기: 도구 모음 · 작성/미리보기 · 파일 불러오기 · 이미지 넣기.
 * textarea는 미리보기 중에도 남아 있어 폼과 함께 저장됩니다.
 */
export default function MarkdownEditor({
  id,
  name,
  label,
  defaultValue,
  rows = 24,
  required = false,
  placeholder = "Markdown으로 쓰세요. .md 파일이나 이미지를 여기로 끌어다 놓거나 붙여 넣어도 됩니다.",
  error,
  onFrontMatter,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  error?: string;
  /** .md 파일을 불러왔을 때 front matter로 다른 칸을 채우고, 채운 칸 이름들을 돌려줍니다. */
  onFrontMatter?: (data: FrontMatter) => string[];
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const mdFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, startPreview] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [dropping, setDropping] = useState(false);

  /** 편집 결과를 textarea에 반영 (실행 취소 ⌘Z가 되도록 insertText 사용) */
  function apply(edit: md.MarkdownEdit) {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(edit.start, edit.end);
    const ok = document.execCommand?.("insertText", false, edit.text);
    if (!ok) ta.setRangeText(edit.text, edit.start, edit.end, "end");
    ta.setSelectionRange(edit.selStart, edit.selEnd);
  }

  function runTool(tool: Tool) {
    const ta = ref.current;
    if (!ta) return;
    if (tab !== "write") setTab("write");
    apply(tool.run(ta.value, ta.selectionStart, ta.selectionEnd));
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(isMac() ? e.metaKey : e.ctrlKey) || e.altKey) return;
    const tool = TOOLS.find((t) => t?.shortcut === e.key.toUpperCase());
    if (tool) {
      e.preventDefault();
      runTool(tool);
    }
  }

  function insertImage(file: File) {
    const ta = ref.current;
    if (!ta) return;
    const [s, e] = [ta.selectionStart, ta.selectionEnd];
    setNote({ text: `"${file.name}" 올리는 중…` });
    startUpload(async () => {
      const result = await uploadImageFile(file);
      if (!result.ok) {
        setNote({ text: result.message, error: true });
        return;
      }
      const alt = file.name.replace(/\.\w+$/, "").replace(/[[\]]/g, "") || "이미지";
      apply(md.image(ta.value, s, e, result.url, alt));
      setNote({ text: `"${file.name}" 이미지를 넣었습니다.` });
    });
  }

  async function importMarkdown(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setNote({ text: "2MB 이하의 마크다운 파일만 불러올 수 있습니다.", error: true });
      return;
    }
    const ta = ref.current;
    if (!ta) return;
    if (ta.value.trim() && !window.confirm("지금 쓴 본문을 파일 내용으로 바꿀까요?")) return;

    const { data, content } = parseFrontMatter(await file.text());
    setTab("write");
    apply({ start: 0, end: ta.value.length, text: content, selStart: 0, selEnd: 0 });
    const filled = onFrontMatter?.(data) ?? [];
    setNote({ text: `"${file.name}" 내용을 본문에 넣었습니다.` + (filled.length ? ` (${filled.join("·")}도 채움)` : "") });
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (IMAGE_ACCEPT.includes(file.type)) insertImage(file);
    else importMarkdown(file);
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    e.preventDefault();
    setDropping(false);
    handleFile(file);
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const file = [...e.clipboardData.files].find((f) => IMAGE_ACCEPT.includes(f.type));
    if (file) {
      e.preventDefault();
      insertImage(file);
    }
  }

  function showPreview() {
    setTab("preview");
    const markdown = ref.current?.value ?? "";
    startPreview(async () => setPreviewHtml(markdown.trim() ? await previewMarkdown(markdown) : ""));
  }

  const mod = isMac() ? "⌘" : "Ctrl+";

  return (
    <div className={`admin-field md-editor${error ? " --error" : ""}`}>
      <div className="editor-toolbar">
        <div className="editor-tabs" role="tablist" aria-label={`${label} 보기 방식`}>
          <button type="button" role="tab" aria-selected={tab === "write"} className="editor-tab" onClick={() => setTab("write")}>
            작성
          </button>
          <button type="button" role="tab" aria-selected={tab === "preview"} className="editor-tab" onClick={showPreview}>
            미리보기
          </button>
        </div>
        <button type="button" className="admin-btn" onClick={() => mdFileRef.current?.click()}>
          Markdown 파일 불러오기
        </button>
      </div>

      <div className="md-toolbar" role="toolbar" aria-label="서식 도구" aria-controls={id}>
        {TOOLS.map((tool, i) =>
          tool ? (
            <button
              key={tool.id}
              type="button"
              className="md-toolbar__button"
              aria-label={tool.label}
              title={tool.shortcut ? `${tool.label} (${mod}${tool.shortcut})` : tool.label}
              disabled={tab !== "write"}
              // 버튼을 눌러도 textarea의 선택이 풀리지 않게
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runTool(tool)}
            >
              {tool.icon}
            </button>
          ) : (
            <span key={`sep-${i}`} className="md-toolbar__sep" aria-hidden="true" />
          ),
        )}
        <button
          type="button"
          className="md-toolbar__button"
          aria-label="이미지 넣기"
          title="이미지 넣기 (끌어다 놓거나 붙여 넣어도 됩니다)"
          disabled={tab !== "write" || uploading}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => imageFileRef.current?.click()}
        >
          <I d="M2 3h12v10H2zM2 11l3.5-3.5 3 3L10.5 8 14 11.5M10.5 6h.01" />
        </button>
      </div>

      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        name={name}
        className={`admin-form__content${dropping ? " --dropping" : ""}`}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
        hidden={tab !== "write"}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDropping(true);
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={onDrop}
      />
      {tab === "preview" && (
        <div className="editor-preview" aria-live="polite" aria-busy={previewing}>
          {previewing ? (
            <p className="admin-empty">미리보기를 만드는 중…</p>
          ) : previewHtml ? (
            <div className="post-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="admin-empty">본문이 비어 있습니다.</p>
          )}
        </div>
      )}

      <input
        ref={mdFileRef}
        type="file"
        accept={MARKDOWN_ACCEPT}
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={imageFileRef}
        type="file"
        accept={IMAGE_ACCEPT.join(",")}
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error ? (
        <span className="admin-field__error">{error}</span>
      ) : (
        note && <span className={note.error ? "admin-field__error" : "admin-field__hint"}>{note.text}</span>
      )}
    </div>
  );
}

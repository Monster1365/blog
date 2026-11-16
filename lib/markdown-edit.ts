/**
 * 마크다운 편집 도구 모음의 글자 변환 (순수 함수).
 * 결과: [start, end] 구간을 text로 바꾼 뒤 [selStart, selEnd]를 선택합니다. (위치는 바꾼 뒤 기준)
 */
export type MarkdownEdit = { start: number; end: number; text: string; selStart: number; selEnd: number };

/** 선택한 글자를 앞뒤 기호로 감싸기 (이미 감싸져 있으면 풀기). 선택이 없으면 예시 글자를 넣고 선택 */
export function wrap(value: string, s: number, e: number, before: string, after: string, placeholder: string): MarkdownEdit {
  const selected = value.slice(s, e);
  if (
    selected &&
    value.slice(s - before.length, s) === before &&
    value.slice(e, e + after.length) === after
  ) {
    return { start: s - before.length, end: e + after.length, text: selected, selStart: s - before.length, selEnd: e - before.length };
  }
  const inner = selected || placeholder;
  const start = s;
  return {
    start,
    end: e,
    text: before + inner + after,
    selStart: start + before.length,
    selEnd: start + before.length + inner.length,
  };
}

function lineRange(value: string, s: number, e: number) {
  const start = value.lastIndexOf("\n", s - 1) + 1;
  // 선택 끝이 줄 맨 앞이면 그 줄은 빼기 (여러 줄을 끌어 선택했을 때)
  const endAt = e > s && value[e - 1] === "\n" ? e - 1 : e;
  let end = value.indexOf("\n", endAt);
  if (end === -1) end = value.length;
  return { start, end };
}

/** 선택한 줄마다 앞에 기호 붙이기 (모두 붙어 있으면 떼기). 번호 목록은 1. 2. 3. */
export function toggleLinePrefix(
  value: string,
  s: number,
  e: number,
  prefix: string | ((index: number) => string),
  match: RegExp,
): MarkdownEdit {
  const { start, end } = lineRange(value, s, e);
  const lines = value.slice(start, end).split("\n");
  const allHave = lines.every((l) => match.test(l));
  const next = lines.map((l, i) => {
    if (allHave) return l.replace(match, "");
    const stripped = l.replace(/^(\s*)(?:[-*+] \[[ x]\] |[-*+] |\d+\. |> |#{1,6} )/, "$1");
    return (typeof prefix === "function" ? prefix(i) : prefix) + stripped;
  });
  const text = next.join("\n");
  return { start, end, text, selStart: start, selEnd: start + text.length };
}

/** 제목: 줄 앞의 # 개수를 level로 맞추기 (같은 단계면 제목 해제) */
export function heading(value: string, s: number, e: number, level: 2 | 3 | 4): MarkdownEdit {
  const { start, end } = lineRange(value, s, e);
  const line = value.slice(start, end);
  const current = line.match(/^(#{1,6}) /)?.[1].length ?? 0;
  const body = line.replace(/^#{1,6} /, "") || "제목";
  const text = current === level ? body : `${"#".repeat(level)} ${body}`;
  const prefixLen = text.length - body.length;
  return { start, end, text, selStart: start + prefixLen, selEnd: start + text.length };
}

/** 앞뒤를 빈 줄로 띄워 블록 넣기. cursor는 블록 안에서 선택할 [시작, 끝] */
export function insertBlock(value: string, s: number, e: number, block: string, cursor?: [number, number]): MarkdownEdit {
  const before = value.slice(0, s);
  const after = value.slice(e);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const text = lead + block + trail;
  const base = s + lead.length;
  const [cs, ce] = cursor ?? [block.length, block.length];
  return { start: s, end: e, text, selStart: base + cs, selEnd: base + ce };
}

/** 코드 블록: 선택한 글자를 ``` 로 감싸기 */
export function codeBlock(value: string, s: number, e: number): MarkdownEdit {
  const selected = value.slice(s, e);
  const lang = "text";
  const body = selected || "코드";
  const block = "```" + lang + "\n" + body + "\n```";
  return insertBlock(value, s, e, block, [4 + lang.length, 4 + lang.length + body.length]);
}

/** 링크: [글자](주소). 선택이 있으면 그 글자를 링크 글자로 쓰고 주소 부분을 선택 */
export function link(value: string, s: number, e: number): MarkdownEdit {
  const selected = value.slice(s, e);
  if (/^https?:\/\/\S+$/.test(selected)) {
    const text = `[링크 글자](${selected})`;
    return { start: s, end: e, text, selStart: s + 1, selEnd: s + 6 };
  }
  const label = selected || "링크 글자";
  const url = "https://";
  const text = `[${label}](${url})`;
  const urlStart = s + label.length + 3;
  return { start: s, end: e, text, selStart: urlStart, selEnd: urlStart + url.length };
}

/**
 * 이미지: ![설명](주소). 넣은 뒤 커서는 이미지 뒤에 둡니다.
 * (설명 글자를 선택해 두면 이어서 넣는 이미지가 그 글자를 덮어씁니다)
 */
export function image(value: string, s: number, e: number, url: string, alt = "이미지 설명"): MarkdownEdit {
  const block = `![${alt}](${url})`;
  return insertBlock(value, s, e, block, [block.length, block.length]);
}

export function table(value: string, s: number, e: number): MarkdownEdit {
  const block = "| 항목 | 내용 |\n| --- | --- |\n| 값 | 값 |";
  return insertBlock(value, s, e, block, [2, 4]);
}

export function horizontalRule(value: string, s: number, e: number): MarkdownEdit {
  return insertBlock(value, s, e, "---");
}

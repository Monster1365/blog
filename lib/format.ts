const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

/** ISO 문자열 → "2026년 10월 1일" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

/** ISO 문자열 → "2026. 11. 16. 20:35" */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** 이름 → URL용 문자열 (태그 앵커, 글 slug). 한글은 유지합니다. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Renpy, Game  ,Python" → ["Renpy", "Game", "Python"] (중복 제거) */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ");
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

/** 제목·목록·코드 블록을 건너뛴 첫 문단을 평문 요약으로 만듭니다. */
export function makeExcerpt(markdown: string, max = 200): string | null {
  const paragraph = markdown
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|[-*+]\s|\d+\.\s|>|\||<|!\[)/.test(block));
  if (!paragraph) return null;

  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text ? truncate(text, max) : null;
}

/** 대표 이미지 이름 → public 경로. 경로나 URL이 들어오면 그대로 씁니다. */
export function featuredImageSrc(name: string): string {
  return name.startsWith("/") || /^https?:\/\//.test(name)
    ? name
    : `/images/posts/${name}.jpg`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function truncateWords(text: string, max: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > max ? `${words.slice(0, max).join(" ")}…` : text;
}

/** Jekyll 테마와 같은 계산: 360단어 미만은 1분, 그 이상은 180단어당 1분 */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return words < 360 ? 1 : Math.floor(words / 180);
}

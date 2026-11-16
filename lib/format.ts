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

/** 카테고리 이름 → URL 앵커 (Jekyll `slugize`와 비슷하게, 한글은 유지) */
export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
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

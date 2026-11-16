import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // "**'강조'**라는"처럼 문장부호 뒤에 한글이 바로 붙어도 굵게 처리 (CommonMark 기본 규칙 보완)
  .use(remarkCjkFriendly)
  // 마크다운 안의 raw HTML은 렌더링하지 않습니다 (DB 내용으로 인한 XSS 방지).
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeShiki, {
    theme: "github-light",
    defaultLanguage: "text",
    fallbackLanguage: "text",
  })
  .use(rehypeStringify);

/** 마크다운 → HTML 문자열 (제목 id, GFM 표·체크리스트, 코드 하이라이팅 포함) */
export async function renderMarkdown(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}

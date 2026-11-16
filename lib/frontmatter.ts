/**
 * 마크다운 파일 맨 위의 YAML front matter를 간단히 읽습니다 (브라우저에서 사용).
 *
 *   ---
 *   title: "글 제목"
 *   tags: [Renpy, Game]      또는  categories:\n  - Renpy\n  - Game
 *   excerpt: 요약
 *   ---
 *
 * 지원: 문자열 값, [a, b] 배열, "- 항목" 목록. 그 밖의 복잡한 YAML은 무시합니다.
 */
export type FrontMatter = Record<string, string | string[]>;

function unquote(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFrontMatter(text: string): { data: FrontMatter; content: string } {
  const normalized = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, content: normalized };

  const data: FrontMatter = {};
  let listKey: string | null = null;

  for (const line of match[1].split("\n")) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      const list = (data[listKey] as string[] | undefined) ?? [];
      data[listKey] = [...list, unquote(item[1])];
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!pair) continue;
    const [, key, raw] = pair;
    const value = raw.trim();
    listKey = null;

    if (!value) {
      listKey = key; // 다음 줄부터 "- 항목" 목록
      data[key] = [];
    } else if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map(unquote)
        .filter(Boolean);
    } else {
      data[key] = unquote(value);
    }
  }

  return { data, content: normalized.slice(match[0].length).replace(/^\n+/, "") };
}

export function frontMatterString(data: FrontMatter, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = data[key];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

export function frontMatterList(data: FrontMatter, ...keys: string[]): string[] | undefined {
  for (const key of keys) {
    const v = data[key];
    if (Array.isArray(v) && v.length) return v;
    if (typeof v === "string" && v) return v.split(/[\s,]+/).filter(Boolean);
  }
  return undefined;
}

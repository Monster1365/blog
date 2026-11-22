import { asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { posts, sections } from "@/db/schema";
import { POSTS_TAG } from "./posts";

/**
 * 섹션: 글을 폴더처럼 묶는 범주 (태그와 별개).
 * 글은 한 섹션에만 들어가고, 섹션 안에 하위 섹션을 둘 수 있습니다.
 */

export type SectionPost = {
  id: number;
  slug: string;
  title: string;
  published: boolean;
};

export type SectionNode = {
  id: number;
  name: string;
  parentId: number | null;
  sections: SectionNode[];
  posts: SectionPost[];
  /** 하위 섹션까지 포함한 글 수 */
  total: number;
};

export type SectionTree = {
  sections: SectionNode[];
  /** 섹션이 없는 글 */
  unsorted: SectionPost[];
};

type SectionRow = { id: number; name: string; parentId: number | null };
type PostRow = SectionPost & { sectionId: number | null };

/** 섹션·글 목록을 트리로 묶습니다 (이미 정렬된 순서를 그대로 씁니다). */
function buildTree(sectionRows: SectionRow[], postRows: PostRow[]): SectionTree {
  const nodes = new Map<number, SectionNode>(
    sectionRows.map((s) => [s.id, { ...s, sections: [], posts: [], total: 0 }]),
  );
  const roots: SectionNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId != null ? nodes.get(node.parentId) : undefined;
    (parent ? parent.sections : roots).push(node);
  }

  const unsorted: SectionPost[] = [];
  for (const { sectionId, ...post } of postRows) {
    const node = sectionId != null ? nodes.get(sectionId) : undefined;
    (node ? node.posts : unsorted).push(post);
  }

  const count = (node: SectionNode): number =>
    (node.total = node.posts.length + node.sections.reduce((n, child) => n + count(child), 0));
  roots.forEach(count);

  return { sections: roots, unsorted };
}

function selectSections() {
  return db
    .select({ id: sections.id, name: sections.name, parentId: sections.parentId })
    .from(sections)
    .orderBy(asc(sections.sortOrder), asc(sections.id));
}

const postColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  published: posts.published,
  sectionId: posts.sectionId,
};
const postOrder = [asc(posts.sectionOrder), desc(posts.publishedAt), desc(posts.id)] as const;

/** 홈 사이드바용: 공개된 글만, 글이 하나도 없는 섹션은 뺍니다. */
export async function getSectionTree(): Promise<SectionTree> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG);

  const [sectionRows, postRows] = await Promise.all([
    selectSections(),
    db.select(postColumns).from(posts).where(eq(posts.published, true)).orderBy(...postOrder),
  ]);
  const tree = buildTree(sectionRows, postRows);

  const prune = (list: SectionNode[]): SectionNode[] =>
    list
      .filter((node) => node.total > 0)
      .map((node) => ({ ...node, sections: prune(node.sections) }));
  return { sections: prune(tree.sections), unsorted: tree.unsorted };
}

/** 관리 페이지용: 빈 섹션과 숨긴 글까지 모두 (캐시하지 않음) */
export async function listSectionsForAdmin(): Promise<SectionTree> {
  const [sectionRows, postRows] = await Promise.all([
    selectSections(),
    db.select(postColumns).from(posts).orderBy(...postOrder),
  ]);
  return buildTree(sectionRows, postRows);
}

export type SectionOption = { id: number; label: string; depth: number };

/** 선택 목록용으로 트리를 펼칩니다. 예: "개발 › 웹" */
export function flattenSections(list: SectionNode[], prefix = "", depth = 0): SectionOption[] {
  return list.flatMap((node) => {
    const label = prefix ? `${prefix} › ${node.name}` : node.name;
    return [{ id: node.id, label, depth }, ...flattenSections(node.sections, label, depth + 1)];
  });
}

/** 섹션과 그 하위 섹션 id 전부 (부모를 고를 때 순환을 막기 위함) */
export function descendantIds(node: SectionNode): number[] {
  return [node.id, ...node.sections.flatMap(descendantIds)];
}

export function findSection(list: SectionNode[], id: number): SectionNode | undefined {
  for (const node of list) {
    if (node.id === id) return node;
    const found = findSection(node.sections, id);
    if (found) return found;
  }
  return undefined;
}

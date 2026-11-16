import Link from "next/link";
import { slugify } from "@/lib/format";

export default function TagLabels({ tags }: { tags: string[] }) {
  return tags.map((tag, i) => (
    <span key={tag}>
      {i > 0 && " "}
      <Link className="label" href={`/tags#${slugify(tag)}`}>
        {tag}
      </Link>
    </span>
  ));
}

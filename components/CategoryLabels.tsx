import Link from "next/link";
import { slugifyCategory } from "@/lib/format";

export default function CategoryLabels({ categories }: { categories: string[] }) {
  return categories.map((category, i) => (
    <span key={category}>
      {i > 0 && " "}
      <Link className="label" href={`/categories#${slugifyCategory(category)}`}>
        {category}
      </Link>
    </span>
  ));
}

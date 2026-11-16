import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/components/admin/AdminLoading";
import PostForm from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "새 글" };

export default function NewPostPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewPost />
    </Suspense>
  );
}

async function NewPost() {
  await requireAdmin();
  return (
    <section>
      <h2 className="admin-title">새 글</h2>
      <PostForm />
    </section>
  );
}

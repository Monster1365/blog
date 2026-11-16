import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminLoading from "@/components/admin/AdminLoading";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "로그인" };

const ERRORS: Record<string, string> = {
  state: "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
  config: "GitHub 로그인 설정이 되어 있지 않습니다. 환경 변수를 확인해 주세요.",
  github: "GitHub에서 사용자 정보를 받아오지 못했습니다. 다시 시도해 주세요.",
  forbidden: "관리자로 등록된 GitHub 계정이 아닙니다.",
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  if (await getAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="admin-login">
      <p>관리 페이지는 블로그 주인의 GitHub 계정으로만 들어갈 수 있습니다.</p>
      {message && <p className="admin-login__error">{message}</p>}
      {/* Route Handler로 이동해야 해서 <Link>가 아닌 <a>를 씁니다. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a className="btn" href="/api/auth/github">
        GitHub로 로그인
      </a>
    </div>
  );
}

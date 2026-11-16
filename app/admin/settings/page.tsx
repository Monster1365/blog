import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoading from "@/components/admin/AdminLoading";
import SettingsForm from "@/components/admin/SettingsForm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const metadata: Metadata = { title: "사이트 설정" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await requireAdmin();
  // 저장된 값 그대로 (빈 칸은 빈 칸으로 보여 주고, 기본값은 안내로만)
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);

  return (
    <section className="admin-narrow">
      <h2 className="admin-title">사이트 설정</h2>
      <p className="admin-help">비워 둔 칸은 기본값을 씁니다. 저장하면 사이트 전체에 바로 반영됩니다.</p>
      <SettingsForm
        saved={{
          title: row?.title ?? "",
          shortTitle: row?.shortTitle ?? "",
          description: row?.description ?? "",
          tagline: row?.tagline ?? "",
          heroImage: row?.heroImage ?? "",
          favicon: row?.favicon ?? "",
          about: row?.about ?? "",
        }}
        defaults={{
          title: DEFAULT_SETTINGS.title,
          shortTitle: DEFAULT_SETTINGS.shortTitle,
          description: DEFAULT_SETTINGS.description,
          tagline: DEFAULT_SETTINGS.tagline,
          heroImage: DEFAULT_SETTINGS.heroImage ?? "",
          favicon: "",
          about: DEFAULT_SETTINGS.about,
        }}
      />
    </section>
  );
}

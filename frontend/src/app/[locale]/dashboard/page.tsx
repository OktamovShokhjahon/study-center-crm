"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/AppHeader";

export default function DashboardIndexPage() {
  const t = useTranslations("dashboard");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const map = {
      ADMIN: "/dashboard/admin",
      TEACHER: "/dashboard/teacher",
      STUDENT: "/dashboard/student",
      PARENT: "/dashboard/parent",
    } as const;
    router.replace(map[user.role]);
  }, [user, loading, router]);

  return (
    <>
      <AppHeader />
      <main className="page-shell flex min-h-[40vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--muted)]">{t("title")}…</p>
      </main>
    </>
  );
}

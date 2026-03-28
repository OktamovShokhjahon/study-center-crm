"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Overview = {
  student: { fullName?: string; username?: string };
  attendance: unknown[];
  grades: unknown[];
};

export default function ParentDashboardPage() {
  const t = useTranslations("dashboard");
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "PARENT") {
      router.replace("/dashboard");
      return;
    }
    apiFetch<Overview>("/api/parent/child-overview", { token }).then(setData).catch(() => {});
  }, [user, loading, router, token]);

  if (loading || !user || user.role !== "PARENT") return null;

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {t("welcome")}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[var(--muted)]">{t("parent")}</p>
        </div>

        {data?.student && (
          <div className="card-surface mt-8 p-6 shadow-soft dark:shadow-soft-dark">
            <p className="text-sm text-[var(--muted)]">Student</p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {data.student.fullName}{" "}
              <span className="font-normal text-[var(--muted)]">({data.student.username})</span>
            </p>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent grades</h2>
          <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
            <pre className="text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
              {JSON.stringify(data?.grades ?? [], null, 2)}
            </pre>
          </div>
        </section>
      </main>
    </>
  );
}

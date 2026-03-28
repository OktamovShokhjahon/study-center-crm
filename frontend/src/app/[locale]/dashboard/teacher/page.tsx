"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Group = { _id: string; name: string; courseId: { name?: string } };

export default function TeacherDashboardPage() {
  const t = useTranslations("dashboard");
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "TEACHER") {
      router.replace("/dashboard");
      return;
    }
    apiFetch<Group[]>("/api/teacher/groups", { token }).then(setGroups).catch(() => {});
  }, [user, loading, router, token]);

  if (loading || !user || user.role !== "TEACHER") return null;

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {t("welcome")}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[var(--muted)]">{t("teacher")}</p>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Groups</h2>
          {groups.length === 0 ? (
            <p className="card-surface mt-4 p-8 text-center text-[var(--muted)] shadow-soft dark:shadow-soft-dark">
              No groups assigned yet.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {groups.map((g) => (
                <li key={g._id}>
                  <article className="card-surface p-5 shadow-soft transition hover:shadow-md dark:shadow-soft-dark">
                    <h3 className="font-semibold text-[var(--foreground)]">{g.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {(g.courseId as { name?: string })?.name ?? "Course"}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

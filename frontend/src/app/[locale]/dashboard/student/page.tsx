"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function StudentDashboardPage() {
  const t = useTranslations("dashboard");
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<unknown[]>([]);
  const [payments, setPayments] = useState<unknown[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "STUDENT") {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      apiFetch<{ schedule: unknown[] }>("/api/student/schedule", { token }),
      apiFetch<unknown[]>("/api/student/payments", { token }),
    ])
      .then(([s, p]) => {
        setSchedule(s.schedule);
        setPayments(p);
      })
      .catch(() => {});
  }, [user, loading, router, token]);

  if (loading || !user || user.role !== "STUDENT") return null;

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {t("welcome")}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[var(--muted)]">{t("student")}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Schedule</h2>
            <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
              <pre className="text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                {JSON.stringify(schedule, null, 2)}
              </pre>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Payments</h2>
            <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
              <pre className="text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                {JSON.stringify(payments, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

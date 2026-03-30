"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getDueCountdown } from "@/lib/dueCountdown";

type Overview = {
  student: { fullName?: string; username?: string };
  attendance: {
    _id: string;
    date: string;
    present: boolean;
    groupId?: { name?: string } | null;
  }[];
  grades: { title?: string; score?: number; maxScore?: number; createdAt?: string }[];
  payments: {
    _id: string;
    amount: number;
    currency: string;
    status: string;
    dueAt?: string;
    groupId?: { name?: string } | null;
  }[];
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

  const payments = data?.payments ?? [];
  const attendance = data?.attendance ?? [];
  const grades = data?.grades ?? [];

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
            <p className="text-sm text-[var(--muted)]">{t("student")}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {data.student.fullName}{" "}
              <span className="font-normal text-[var(--muted)]">({data.student.username})</span>
            </p>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("parentPaymentsTitle")}</h2>
          <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
            {payments.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t("noPayments")}</p>
            ) : (
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("paymentAmountCol")}</th>
                    <th className="py-2 pr-3 font-medium">{t("paymentStatusCol")}</th>
                    <th className="py-2 font-medium">{t("paymentDueCol")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {payments.map((p) => {
                    const cd = getDueCountdown(p.dueAt, p.status);
                    const cdLabel =
                      cd.type === "paid"
                        ? t("paymentPaidShort")
                        : cd.type === "none"
                          ? "—"
                          : cd.type === "overdue"
                            ? t("paymentOverdueShort")
                            : cd.days > 0
                              ? t("countdownDaysHours", { days: cd.days, hours: cd.hours })
                              : cd.hours > 0
                                ? t("countdownHoursMinutes", { hours: cd.hours, minutes: cd.minutes })
                                : t("countdownMinutes", { minutes: cd.minutes });
                    return (
                      <tr key={p._id}>
                        <td className="py-2 pr-3 tabular-nums font-medium text-[var(--foreground)]">
                          {p.amount} {p.currency}
                        </td>
                        <td className="py-2 pr-3 text-[var(--muted)]">{p.status}</td>
                        <td className="py-2 text-[var(--foreground)]">
                          <div>{cdLabel}</div>
                          {(p.groupId as { name?: string } | undefined)?.name && (
                            <div className="text-xs text-[var(--muted)]">
                              {(p.groupId as { name?: string }).name}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("parentAttendanceTitle")}</h2>
          <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
            {attendance.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t("noAttendanceRows")}</p>
            ) : (
              <table className="w-full min-w-[300px] text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("attendanceDateCol")}</th>
                    <th className="py-2 pr-3 font-medium">{t("attendanceGroupCol")}</th>
                    <th className="py-2 font-medium">{t("attendanceStatusCol")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {attendance.map((row) => (
                    <tr key={row._id}>
                      <td className="py-2 pr-3 text-[var(--foreground)]">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3 text-[var(--muted)]">
                        {(row.groupId as { name?: string } | undefined)?.name ?? "—"}
                      </td>
                      <td className="py-2 text-[var(--foreground)]">
                        {row.present ? t("presentLabel") : t("absentLabel")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("gradesTitle")}</h2>
          <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
            {grades.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">—</p>
            ) : (
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("gradeColTitle")}</th>
                    <th className="py-2 font-medium">{t("gradeColScore")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {grades.map((g) => (
                    <tr key={String(g.createdAt) + (g.title ?? "")}>
                      <td className="py-2 pr-3 text-[var(--foreground)]">{g.title ?? "—"}</td>
                      <td className="py-2 tabular-nums text-[var(--muted)]">
                        {g.score ?? "—"} / {g.maxScore ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

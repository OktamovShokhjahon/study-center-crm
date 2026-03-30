"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getDueCountdown } from "@/lib/dueCountdown";

type ScheduleItem = {
  groupName: string;
  course?: string;
  dayLabel: string;
  startMinutes: number;
  endMinutes: number;
  room?: string;
};

type PaymentItem = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  dueAt?: string;
  groupId?: { name?: string } | null;
  courseId?: { name?: string } | null;
};

type AttendanceRow = {
  _id: string;
  date: string;
  present: boolean;
  groupId?: { name?: string } | null;
};

export default function StudentDashboardPage() {
  const t = useTranslations("dashboard");
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "STUDENT") {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      apiFetch<{ schedule: ScheduleItem[] }>("/api/student/schedule", { token }),
      apiFetch<PaymentItem[]>("/api/student/payments", { token }),
      apiFetch<AttendanceRow[]>("/api/student/attendance", { token }),
    ])
      .then(([s, p, a]) => {
        setSchedule(s.schedule);
        setPayments(p);
        setAttendance(a);
      })
      .catch(() => {});
  }, [user, loading, router, token]);

  if (loading || !user || user.role !== "STUDENT") return null;

  function fmtMin(m: number) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}:${String(min).padStart(2, "0")}`;
  }

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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("scheduleTitle")}</h2>
            <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
              {schedule.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t("noSchedule")}</p>
              ) : (
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                    <tr>
                      <th className="py-2 pr-3 font-medium">{t("scheduleDay")}</th>
                      <th className="py-2 pr-3 font-medium">{t("scheduleTime")}</th>
                      <th className="py-2 font-medium">{t("scheduleCourse")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {schedule.map((row, i) => (
                      <tr key={`${row.groupName}-${row.dayLabel}-${i}`}>
                        <td className="py-2 pr-3 text-[var(--foreground)]">{row.dayLabel}</td>
                        <td className="py-2 pr-3 tabular-nums text-[var(--muted)]">
                          {fmtMin(row.startMinutes)} – {fmtMin(row.endMinutes)}
                        </td>
                        <td className="py-2 text-[var(--foreground)]">
                          {row.course ?? row.groupName}
                          {row.room ? (
                            <span className="block text-xs text-[var(--muted)]">{row.room}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("paymentsTitle")}</h2>
            <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
              {payments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t("noPayments")}</p>
              ) : (
                <table className="w-full min-w-[300px] text-left text-sm">
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
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("attendanceTitle")}</h2>
          <div className="card-surface mt-4 overflow-x-auto p-5 shadow-soft dark:shadow-soft-dark">
            {attendance.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t("noAttendanceRows")}</p>
            ) : (
              <table className="w-full min-w-[360px] text-left text-sm">
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
      </main>
    </>
  );
}


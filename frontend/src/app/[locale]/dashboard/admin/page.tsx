"use client";

import {
  AlertTriangle,
  GraduationCap,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AdminStats = {
  dailyRevenue: number;
  activeStudents: number;
  outstandingPayments: number;
  newRegistrations: number;
  teacherActivity: { totalTeachers: number; recent: { fullName: string }[] };
};

const statStyles: {
  bar: string;
  Icon: LucideIcon;
  bg: string;
  iconClass: string;
}[] = [
  {
    bar: "border-l-teal-500",
    Icon: TrendingUp,
    bg: "bg-[var(--success-muted)]",
    iconClass: "text-teal-600 dark:text-teal-400",
  },
  {
    bar: "border-l-indigo-500",
    Icon: GraduationCap,
    bg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    iconClass: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bar: "border-l-amber-500",
    Icon: AlertTriangle,
    bg: "bg-[var(--warning-muted)]",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    bar: "border-l-violet-500",
    Icon: Sparkles,
    bg: "bg-violet-500/10 dark:bg-violet-400/10",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
];

export default function AdminDashboardPage() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("admin");
  const tNav = useTranslations("adminNav");
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AdminStats>("/api/dashboard/admin", { token })
      .then(setStats)
      .catch(() => setErr("x"));
  }, [token]);

  const statItems = stats
    ? [
        { label: t("revenueToday"), value: String(stats.dailyRevenue), ...statStyles[0] },
        { label: t("activeStudents"), value: String(stats.activeStudents), ...statStyles[1] },
        { label: t("outstanding"), value: String(stats.outstandingPayments), ...statStyles[2] },
        { label: t("newReg"), value: String(stats.newRegistrations), ...statStyles[3] },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-[var(--muted)]">{ta("overviewSubtitle")}</p>
        </div>
      </div>

      {err && (
        <p className="mt-6 rounded-xl border border-red-200 bg-[var(--danger-muted)] px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:text-red-300">
          {t("loadError")}
        </p>
      )}

      {stats && (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map(({ label, value, Icon, bar, bg, iconClass }) => (
            <li key={label}>
              <div
                className={`card-surface flex gap-4 border-l-4 p-5 shadow-soft dark:shadow-soft-dark ${bar}`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}
                  aria-hidden
                >
                  <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--foreground)]">
                    {value}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6 shadow-soft dark:shadow-soft-dark">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("quickActions")}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/admin/students/new" className="btn-primary shadow-soft dark:shadow-soft-dark">
              {ta("createStudent")}
            </Link>
            <Link href="/dashboard/admin/teachers/new" className="btn-secondary">
              {ta("addTeacher")}
            </Link>
            <Link href="/dashboard/admin/students" className="btn-secondary">
              {ta("viewAllStudents")}
            </Link>
            <Link href="/dashboard/admin/teachers" className="btn-secondary">
              {ta("viewAllTeachers")}
            </Link>
            <Link href="/dashboard/admin/courses" className="btn-secondary">
              {tNav("courses")}
            </Link>
            <Link href="/dashboard/admin/groups" className="btn-secondary">
              {tNav("groups")}
            </Link>
            <Link href="/dashboard/admin/credentials" className="btn-secondary">
              {tNav("credentials")}
            </Link>
          </div>
        </div>

        {stats && stats.teacherActivity.recent.length > 0 && (
          <div className="card-surface p-6 shadow-soft dark:shadow-soft-dark">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("teachers")}</h2>
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {stats.teacherActivity.recent.map((x) => (
                <li key={x.fullName} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)]">
                    {x.fullName.charAt(0)}
                  </span>
                  <span className="font-medium text-[var(--foreground)]">{x.fullName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

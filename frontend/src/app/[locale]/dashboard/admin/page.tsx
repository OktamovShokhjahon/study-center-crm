"use client";

import {
  AlertTriangle,
  GraduationCap,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@/i18n/routing";
import { apiFetch, downloadWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type AdminStats = {
  dailyRevenue: number;
  activeStudents: number;
  outstandingPayments: number;
  newRegistrations: number;
  overdueCount?: number;
  overdueAmount?: number;
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
    bar: "border-l-emerald-500",
    Icon: Sparkles,
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
];

const PIE_COLORS = ["#059669", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];

export default function AdminDashboardPage() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("admin");
  const tNav = useTranslations("adminNav");
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bucket, setBucket] = useState<"day" | "week" | "month">("day");
  const [rangeFrom, setRangeFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [rangeTo, setRangeTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [series, setSeries] = useState<{ date: string; total: number }[]>([]);
  const [breakdown, setBreakdown] = useState<{ courseName: string; total: number }[]>([]);
  const [chartErr, setChartErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AdminStats>("/api/dashboard/admin", { token })
      .then(setStats)
      .catch(() => setErr("x"));
  }, [token]);

  const loadCharts = useCallback(() => {
    setChartErr(null);
    const from = new Date(rangeFrom);
    const to = new Date(rangeTo);
    to.setHours(23, 59, 59, 999);
    const qsSeries = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      bucket,
    });
    const qsCourse = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    Promise.all([
      apiFetch<{ series: { date: string; total: number }[] }>(
        `/api/dashboard/admin/revenue-series?${qsSeries}`,
        { token }
      ),
      apiFetch<{ breakdown: { courseName: string; total: number }[] }>(
        `/api/dashboard/admin/revenue-by-course?${qsCourse}`,
        { token }
      ),
    ])
      .then(([s, b]) => {
        setSeries(s.series);
        setBreakdown(b.breakdown);
      })
      .catch(() => setChartErr("x"));
  }, [bucket, token, rangeFrom, rangeTo]);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  async function onExport(fmt: "xlsx" | "pdf") {
    const from = new Date(rangeFrom).toISOString();
    const to = new Date(rangeTo);
    to.setHours(23, 59, 59, 999);
    const qs = new URLSearchParams({
      from,
      to: to.toISOString(),
      format: fmt,
    });
    const name = `income-${rangeFrom}-${rangeTo}.${fmt === "xlsx" ? "xlsx" : "pdf"}`;
    await downloadWithAuth(`/api/dashboard/admin/income-export?${qs}`, token, name);
  }

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

      {stats && (stats.overdueCount ?? 0) > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-[var(--warning-muted)] px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:text-amber-100">
          {t("overdueBanner", { count: stats.overdueCount ?? 0, amount: String(stats.overdueAmount ?? 0) })}
        </div>
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

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("incomeChartsTitle")}</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="label mb-1">{t("rangeFrom")}</label>
            <input
              type="date"
              className="input-field !py-2"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label mb-1">{t("rangeTo")}</label>
            <input
              type="date"
              className="input-field !py-2"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
            />
          </div>
          <div>
            <label className="label mb-1">{t("chartBucket")}</label>
            <select
              className="input-field !py-2"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as "day" | "week" | "month")}
            >
              <option value="day">{t("bucketDay")}</option>
              <option value="week">{t("bucketWeek")}</option>
              <option value="month">{t("bucketMonth")}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => onExport("xlsx")}>
              {t("exportExcel")}
            </button>
            <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => onExport("pdf")}>
              {t("exportPdf")}
            </button>
          </div>
        </div>

        {chartErr && (
          <p className="mt-4 text-sm text-red-600">{t("chartLoadError")}</p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card-surface p-4 shadow-soft dark:shadow-soft-dark">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("revenueTrend")}</h3>
            <div className="mt-4 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-surface p-4 shadow-soft dark:shadow-soft-dark">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("revenueByCourse")}</h3>
            <div className="mt-4 h-64 w-full min-w-0">
              {breakdown.length === 0 ? (
                <p className="p-4 text-sm text-[var(--muted)]">{t("noChartData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="total"
                      nameKey="courseName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${String(name)}: ${value}`}
                    >
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="card-surface mt-6 overflow-x-auto p-4 shadow-soft dark:shadow-soft-dark">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("revenueByCourseBar")}</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseName" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

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

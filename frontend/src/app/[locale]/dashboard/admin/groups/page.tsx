"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type GroupRow = {
  _id: string;
  name: string;
  courseId?: {
    name?: string;
    teacherId?: { fullName?: string };
  };
};

export default function AdminGroupsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<GroupRow[]>("/api/groups", { token })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("groupsPageTitle")}</h1>
          <p className="mt-1 text-[var(--muted)]">{t("groupsPageSubtitle")}</p>
        </div>
        <Link href="/dashboard/admin/groups/new" className="btn-primary w-fit">
          {t("createGroup")}
        </Link>
      </div>

      <div className="card-surface mt-8 overflow-hidden shadow-soft dark:shadow-soft-dark">
        {loading ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("noGroups")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("groupColName")}</th>
                  <th className="px-4 py-3 font-medium">{t("courseColName")}</th>
                  <th className="px-4 py-3 font-medium">{t("assignedTeacher")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((g) => {
                  const course = g.courseId as { name?: string; teacherId?: { fullName?: string } } | undefined;
                  return (
                    <tr key={g._id}>
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{g.name}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{course?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {course?.teacherId?.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/groups/${g._id}`}
                          className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
                        >
                          {t("view")}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

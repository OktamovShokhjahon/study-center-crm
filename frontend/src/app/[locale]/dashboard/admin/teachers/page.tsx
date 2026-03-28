"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CopyableSecret } from "@/components/CopyableSecret";

type UserRow = {
  _id: string;
  fullName: string;
  username: string;
  role: string;
  createdAt: string;
  passwordPlain?: string | null;
};

export default function AdminTeachersListPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserRow[]>(`/api/users?role=TEACHER`, { token })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("teachersPageTitle")}</h1>
          <p className="mt-1 text-[var(--muted)]">{t("viewAllTeachers")}</p>
        </div>
        <Link href="/dashboard/admin/teachers/new" className="btn-primary w-fit">
          {t("addTeacher")}
        </Link>
      </div>

      <div className="card-surface mt-8 overflow-hidden shadow-soft dark:shadow-soft-dark">
        {loading ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("noTeachers")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("tableName")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableUsername")}</th>
                  <th className="px-4 py-3 font-medium">{t("tablePassword")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableJoined")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((u) => (
                  <tr key={u._id} className="hover:bg-[var(--accent-muted)]/30">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{u.fullName}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{u.username}</td>
                    <td className="max-w-[200px] px-4 py-3">
                      <CopyableSecret value={u.passwordPlain} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/teachers/${u._id}`}
                        className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
                      >
                        {t("view")}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

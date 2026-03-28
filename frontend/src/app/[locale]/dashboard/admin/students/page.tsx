"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CopyableSecret } from "@/components/CopyableSecret";

type StudentRow = {
  _id: string;
  fullName: string;
  username: string;
  createdAt: string;
  passwordPlain?: string | null;
};

export default function AdminStudentsListPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<StudentRow[]>("/api/students", { token })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("studentsPageTitle")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("viewAllStudents")}</p>

      <div className="card-surface mt-8 overflow-hidden shadow-soft dark:shadow-soft-dark">
        {loading ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("noStudents")}</p>
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
                {rows.map((s) => (
                  <tr key={s._id} className="hover:bg-[var(--accent-muted)]/30">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.fullName}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{s.username}</td>
                    <td className="max-w-[200px] px-4 py-3">
                      <CopyableSecret value={s.passwordPlain} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/students/${s._id}`}
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

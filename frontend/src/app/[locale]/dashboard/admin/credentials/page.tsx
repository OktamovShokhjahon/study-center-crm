"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CopyableSecret } from "@/components/CopyableSecret";

type UserRow = {
  _id: string;
  fullName: string;
  username: string;
  role: string;
  passwordPlain?: string | null;
};

export default function AdminCredentialsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserRow[]>("/api/users", { token })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("credentialsPageTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{t("credentialsPageSubtitle")}</p>
      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("passwordNote")}</p>

      <div className="card-surface mt-8 overflow-hidden shadow-soft dark:shadow-soft-dark">
        {loading ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("loading")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("tableRole")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableName")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableUsername")}</th>
                  <th className="px-4 py-3 font-medium">{t("tablePassword")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((u) => (
                  <tr key={u._id} className="hover:bg-[var(--accent-muted)]/20">
                    <td className="px-4 py-3 text-[var(--muted)]">{u.role}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{u.fullName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{u.username}</td>
                    <td className="px-4 py-3">
                      <CopyableSecret value={u.passwordPlain} />
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

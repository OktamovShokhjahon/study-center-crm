"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type CreateRes = {
  id: string;
  fullName: string;
  username: string;
  role: string;
  temporaryPassword: string;
};

export default function NewTeacherPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreateRes | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiFetch<CreateRes>("/api/users", {
        method: "POST",
        body: JSON.stringify({ fullName, username, role: "TEACHER" }),
        token,
      });
      setCreated(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("addTeacherTitle")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("addTeacherSubtitle")}</p>

      {!created ? (
        <form onSubmit={onSubmit} className="card-surface mt-8 max-w-lg p-8 shadow-soft dark:shadow-soft-dark">
          <div>
            <label className="label" htmlFor="fullName">
              {t("fullName")}
            </label>
            <input
              id="fullName"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="mt-5">
            <label className="label" htmlFor="username">
              {t("tableUsername")}
            </label>
            <input
              id="username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-[var(--danger-muted)] px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="btn-primary">
              {t("addTeacher")}
            </button>
            <Link href="/dashboard/admin/teachers" className="btn-secondary">
              {t("backToDashboard")}
            </Link>
          </div>
        </form>
      ) : (
        <div className="card-surface mt-8 max-w-lg space-y-4 p-8 shadow-soft dark:shadow-soft-dark">
          <p className="font-medium text-[var(--foreground)]">{created.fullName}</p>
          <p className="text-sm text-[var(--muted)]">
            {t("tableUsername")}: <span className="font-mono text-[var(--foreground)]">{created.username}</span>
          </p>
          <div className="rounded-xl border border-amber-200/80 bg-[var(--warning-muted)] px-4 py-3 dark:border-amber-900/40">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">{t("temporaryPassword")}</p>
            <p className="mt-1 font-mono text-lg text-[var(--foreground)]">{created.temporaryPassword}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/dashboard/admin/teachers/${created.id}`} className="btn-primary">
              {t("view")}
            </Link>
            <Link href="/dashboard/admin/teachers" className="btn-secondary">
              {t("teachersPageTitle")}
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setCreated(null);
                setFullName("");
                setUsername("");
              }}
            >
              {t("addTeacher")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

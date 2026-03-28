"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type CreateStudentResponse = {
  credentials: {
    student: { username: string; password: string };
    parent1: { username: string; password: string };
    parent2: { username: string; password: string };
  };
  pdfBase64: string;
  message: string;
};

export default function NewStudentPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [fullName, setFullName] = useState("");
  const [result, setResult] = useState<CreateStudentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiFetch<CreateStudentResponse>("/api/students", {
        method: "POST",
        body: JSON.stringify({ fullName }),
        token,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  function downloadPdf() {
    if (!result?.pdfBase64) return;
    const blob = new Blob([Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "login-card.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("createStudent")}</h1>

      {!result ? (
        <form onSubmit={onSubmit} className="card-surface mt-8 p-8 shadow-soft dark:shadow-soft-dark">
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
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-[var(--danger-muted)] px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="btn-primary">
              {t("create")}
            </button>
            <Link href="/dashboard/admin/students" className="btn-secondary">
              {t("studentsPageTitle")}
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-amber-200/80 bg-[var(--warning-muted)] px-5 py-4 text-sm text-amber-900 dark:border-amber-900/40 dark:text-amber-100">
            {result.message}
          </div>
          <div className="card-surface p-8 shadow-soft dark:shadow-soft-dark">
            <h2 className="font-semibold text-[var(--foreground)]">{t("credentialsTitle")}</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--background)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
              {JSON.stringify(result.credentials, null, 2)}
            </pre>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={downloadPdf} className="btn-primary">
                {t("downloadPdf")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFullName("");
                }}
                className="btn-secondary"
              >
                {t("addAnother")}
              </button>
              <Link href="/dashboard/admin/students" className="btn-secondary">
                {t("studentsPageTitle")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

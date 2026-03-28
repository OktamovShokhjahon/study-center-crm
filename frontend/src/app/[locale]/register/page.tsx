"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch, setStoredAuth } from "@/lib/api";
import { useAuth, type AuthUser } from "@/context/AuthContext";

type RegisterResponse = {
  token: string;
  center: { id: string; name: string; subdomain: string };
  user: AuthUser;
};

export default function RegisterPage() {
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { login } = useAuth();
  const [centerName, setCenterName] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          centerName,
          adminFullName,
          adminUsername,
          adminPassword,
        }),
        token: null,
      });
      setStoredAuth(data.token, JSON.stringify(data.user));
      login(data.token, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as Error).message)
          : "Error";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="page-shell flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
        <div className="card-surface w-full max-w-md p-8 shadow-soft dark:shadow-soft-dark">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t("title")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{t("subtitle")}</p>
          </div>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="centerName">
                {t("centerName")}
              </label>
              <input
                id="centerName"
                className="input-field"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="adminFullName">
                {t("adminFullName")}
              </label>
              <input
                id="adminFullName"
                className="input-field"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="adminUsername">
                {t("adminUsername")}
              </label>
              <input
                id="adminUsername"
                className="input-field"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="adminPassword">
                {t("adminPassword")}
              </label>
              <input
                id="adminPassword"
                type="password"
                className="input-field"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p
                className="rounded-xl border border-red-200 bg-[var(--danger-muted)] px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {t("submit")}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            {t("hasAccount")}{" "}
            <Link href="/login" className="link-muted font-semibold">
              {tCommon("login")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

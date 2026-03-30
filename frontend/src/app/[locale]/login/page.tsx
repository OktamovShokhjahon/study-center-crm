"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch, setStoredAuth } from "@/lib/api";
import { useAuth, type AuthUser } from "@/context/AuthContext";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

export default function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        token: null,
      });
      setStoredAuth(data.token, JSON.stringify(data.user));
      login(data.token, data.user);
      router.push("/dashboard");
    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="card-surface w-full max-w-md p-8 shadow-soft dark:shadow-soft-dark">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t("title")}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("subtitle")}</p>
          </div>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="username">
                {t("username")}
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
            <div>
              <label className="label" htmlFor="password">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            {t("noAccount")}{" "}
            <Link href="/register" className="link-muted font-semibold">
              {tCommon("register")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

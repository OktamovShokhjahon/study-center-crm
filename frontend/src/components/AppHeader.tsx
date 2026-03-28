"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";
}

export function AppHeader() {
  const t = useTranslations("common");
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-md shadow-violet-500/25 dark:from-violet-500 dark:to-fuchsia-500">
            SC
          </span>
          <span className="font-semibold tracking-tight text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
            {t("appName")}
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-medium uppercase tracking-wide text-[var(--muted)] sm:inline">
            {t("language")}
          </span>
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-xs font-semibold text-[var(--accent)]"
                  aria-hidden
                >
                  {initials(user.fullName)}
                </span>
                <span className="max-w-[140px] truncate text-sm font-medium text-[var(--foreground)]">
                  {user.fullName}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary !py-2 text-xs sm:text-sm"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary !py-2.5 text-xs sm:text-sm">
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

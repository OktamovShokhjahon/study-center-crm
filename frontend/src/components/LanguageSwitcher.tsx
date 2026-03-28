"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

const locales = [
  { code: "uz", label: "UZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-0.5 shadow-sm"
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => router.replace(pathname, { locale: l.code })}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            locale === l.code
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm dark:text-slate-900"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

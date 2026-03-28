"use client";

import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

/** Persists theme and language to the API when the user is logged in. */
export function UserSettingsSync() {
  const { theme } = useTheme();
  const locale = useLocale();
  const { user, token } = useAuth();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !token || !theme) return;
    const lang = locale === "en" || locale === "ru" || locale === "uz" ? locale : "uz";
    const mode = theme === "dark" ? "dark" : "light";
    const sig = `${mode}|${lang}|${user.id}`;
    if (lastSent.current === sig) return;
    lastSent.current = sig;
    apiFetch("/api/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({ theme: mode, language: lang }),
      token,
    }).catch(() => {});
  }, [theme, locale, user, token]);

  return null;
}

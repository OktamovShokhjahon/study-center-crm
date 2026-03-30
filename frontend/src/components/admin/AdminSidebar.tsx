"use client";

import {
  BookOpen,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  School,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

type Key =
  | "overview"
  | "students"
  | "teachers"
  | "courses"
  | "groups"
  | "credentials"
  | "addStudent";

const main: { href: string; labelKey: Key; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { href: "/dashboard/admin", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/students", labelKey: "students", icon: School },
  { href: "/dashboard/admin/teachers", labelKey: "teachers", icon: GraduationCap },
  { href: "/dashboard/admin/courses", labelKey: "courses", icon: BookOpen },
  { href: "/dashboard/admin/groups", labelKey: "groups", icon: UsersRound },
  { href: "/dashboard/admin/credentials", labelKey: "credentials", icon: KeyRound },
];

export function AdminSidebar() {
  const t = useTranslations("adminNav");
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (active: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 md:gap-3 md:py-2.5 ${
      active
        ? "bg-gradient-to-r from-emerald-600/18 to-teal-600/12 text-emerald-800 shadow-sm shadow-emerald-900/5 dark:text-emerald-300"
        : "text-[var(--muted)] hover:bg-[var(--accent-muted)]/50 hover:text-[var(--foreground)]"
    }`;

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm md:w-56 md:border-b-0 md:border-r lg:w-64">
      <nav
        className="flex flex-row gap-1 overflow-x-auto px-2 py-2 md:flex-col md:gap-0.5 md:px-3 md:py-6"
        aria-label="Admin"
      >
        {main.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="whitespace-nowrap">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <div className="mx-1 hidden h-8 w-px shrink-0 bg-[var(--border)] md:mx-0 md:my-2 md:block md:h-px md:w-full" />
        <Link
          href="/dashboard/admin/students/new"
          className={linkClass(pathname.startsWith("/dashboard/admin/students/new"))}
        >
          <UserPlus className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="whitespace-nowrap">{t("addStudent")}</span>
        </Link>
      </nav>
    </aside>
  );
}

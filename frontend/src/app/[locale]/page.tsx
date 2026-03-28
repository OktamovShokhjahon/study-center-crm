import { BarChart3, Globe, Users, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";

export default async function HomePage() {
  const t = await getTranslations("landing");

  const features: { title: string; desc: string; Icon: LucideIcon }[] = [
    { title: t("feature1Title"), desc: t("feature1Desc"), Icon: Users },
    { title: t("feature2Title"), desc: t("feature2Desc"), Icon: BarChart3 },
    { title: t("feature3Title"), desc: t("feature3Desc"), Icon: Globe },
  ];

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] shadow-sm">
            {t("badge")}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl sm:leading-tight">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="btn-primary min-w-[160px] shadow-soft dark:shadow-soft-dark">
              {t("ctaLogin")}
            </Link>
          </div>
        </div>

        <ul className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
          {features.map(({ title, desc, Icon }) => (
            <li key={title}>
              <article className="card-surface h-full p-6 transition hover:shadow-soft dark:hover:shadow-soft-dark">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]" aria-hidden>
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-semibold text-[var(--foreground)]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </article>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Course = { _id: string; name: string };

export default function NewGroupPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    apiFetch<Course[]>("/api/courses", { token })
      .then((c) => {
        setCourses(c);
        if (c.length) setCourseId(c[0]!._id);
      })
      .catch(() => {});
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const g = await apiFetch<{ _id: string }>("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name, courseId, schedule: [] }),
      token,
    });
    router.push(`/dashboard/admin/groups/${g._id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("newGroupTitle")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("newGroupSubtitle")}</p>

      <form onSubmit={onSubmit} className="card-surface mt-8 p-8 shadow-soft dark:shadow-soft-dark">
        <div>
          <label className="label">{t("groupColName")}</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mt-5">
          <label className="label">{t("courseColName")}</label>
          <select
            className="input-field"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            {t("createGroup")}
          </button>
          <Link href="/dashboard/admin/groups" className="btn-secondary">
            {t("groupsPageTitle")}
          </Link>
        </div>
      </form>
    </div>
  );
}

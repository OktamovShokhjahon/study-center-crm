"use client";

import { Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Course = {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  teacherId: { fullName?: string; username?: string };
};
type Teacher = { _id: string; fullName: string; username: string };

export default function AdminCoursesPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("UZS");
  const [teacherId, setTeacherId] = useState("");

  const load = useCallback(() => {
    Promise.all([
      apiFetch<Course[]>("/api/courses", { token }),
      apiFetch<Teacher[]>(`/api/users?role=TEACHER`, { token }),
    ])
      .then(([c, te]) => {
        setCourses(c);
        setTeachers(te);
        setTeacherId((prev) => prev || (te[0]?._id ?? ""));
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await apiFetch("/api/courses", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description || undefined,
        teacherId,
        price: Number(price),
        currency: currency || "UZS",
      }),
      token,
    });
    setName("");
    setDescription("");
    setPrice("0");
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    await apiFetch(`/api/courses/${id}`, { method: "DELETE", token });
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("coursesPageTitle")}</h1>
      <p className="mt-1 text-[var(--muted)]">{t("coursesPageSubtitle")}</p>

      <form onSubmit={onCreate} className="card-surface mt-8 p-6 shadow-soft dark:shadow-soft-dark">
        <h2 className="font-semibold text-[var(--foreground)]">{t("createCourse")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">{t("courseName")}</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("coursePrice")}</label>
            <input
              className="input-field"
              type="number"
              min={0}
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t("currency")}</label>
            <input
              className="input-field"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={8}
            />
          </div>
          <div>
            <label className="label">{t("assignedTeacher")}</label>
            <select
              className="input-field"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            >
              {teachers.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("courseDescription")}</label>
            <input
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4">
          {t("createCourse")}
        </button>
      </form>

      <div className="card-surface mt-8 overflow-hidden shadow-soft dark:shadow-soft-dark">
        {loading ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("loading")}</p>
        ) : courses.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">{t("noCourses")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("courseName")}</th>
                  <th className="px-4 py-3 font-medium">{t("coursePrice")}</th>
                  <th className="px-4 py-3 font-medium">{t("assignedTeacher")}</th>
                  <th className="px-4 py-3 font-medium">{t("tableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.name}</td>
                    <td className="px-4 py-3 text-[var(--muted)] tabular-nums">
                      {c.price ?? 0} {c.currency ?? "UZS"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {(c.teacherId as { fullName?: string })?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onDelete(c._id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("deleteCourse")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

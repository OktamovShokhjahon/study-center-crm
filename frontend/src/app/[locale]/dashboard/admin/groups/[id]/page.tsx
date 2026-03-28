"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CopyableSecret } from "@/components/CopyableSecret";

type GroupDetail = {
  _id: string;
  name: string;
  courseName?: string;
  teacher: {
    fullName?: string;
    username?: string;
    passwordPlain?: string | null;
  } | null;
  students: { _id: string; fullName: string; username: string; passwordPlain?: string | null }[];
};

type StudentOpt = { _id: string; fullName: string; username: string };

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("admin");
  const td = useTranslations("dashboard");
  const { token } = useAuth();
  const [data, setData] = useState<GroupDetail | null>(null);
  const [allStudents, setAllStudents] = useState<StudentOpt[]>([]);
  const [pick, setPick] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<GroupDetail>(`/api/groups/${id}`, { token }),
      apiFetch<StudentOpt[]>("/api/students", { token }),
    ])
      .then(([g, s]) => {
        if (!cancelled) {
          setData(g);
          setAllStudents(s);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const memberIds = new Set(data?.students.map((s) => s._id) ?? []);
  const available = allStudents.filter((s) => !memberIds.has(s._id));

  async function reload() {
    const [g, s] = await Promise.all([
      apiFetch<GroupDetail>(`/api/groups/${id}`, { token }),
      apiFetch<StudentOpt[]>("/api/students", { token }),
    ]);
    setData(g);
    setAllStudents(s);
  }

  async function addStudent(e: FormEvent) {
    e.preventDefault();
    if (!pick) return;
    await apiFetch(`/api/groups/${id}/students`, {
      method: "POST",
      body: JSON.stringify({ studentId: pick }),
      token,
    });
    setPick("");
    await reload();
  }

  async function removeStudent(sid: string) {
    if (!confirm("Remove student from this group?")) return;
    await apiFetch(`/api/groups/${id}/students/${sid}`, { method: "DELETE", token });
    await reload();
  }

  if (loading && !data) {
    return <p className="text-[var(--muted)]">{t("loading")}</p>;
  }
  if (!data) {
    return (
      <p className="text-red-600">
        {td("loadError")}{" "}
        <Link href="/dashboard/admin/groups" className="link-muted">
          {t("groupsPageTitle")}
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/admin/groups"
        className="mb-6 inline-block text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {t("groupsPageTitle")}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{data.name}</h1>
      <p className="mt-1 text-[var(--muted)]">
        {t("courseColName")}: {data.courseName ?? "—"}
      </p>

      <section className="card-surface mt-8 p-6 shadow-soft dark:shadow-soft-dark">
        <h2 className="font-semibold text-[var(--foreground)]">{t("teacherAssigned")}</h2>
        {data.teacher ? (
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-[var(--foreground)]">{data.teacher.fullName}</p>
            <p className="text-[var(--muted)]">{data.teacher.username}</p>
            <p className="text-xs text-[var(--muted)]">
              {t("passwordLabel")}: <CopyableSecret value={data.teacher.passwordPlain} />
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[var(--muted)]">—</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("studentsPageTitle")}</h2>
        <form onSubmit={addStudent} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="label">{t("selectStudent")}</label>
            <select className="input-field" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">—</option>
              {available.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.username})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={!pick}>
            {t("addStudentToGroup")}
          </button>
        </form>

        <div className="card-surface mt-4 overflow-x-auto shadow-soft dark:shadow-soft-dark">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">{t("tableName")}</th>
                <th className="px-4 py-3 font-medium">{t("tableUsername")}</th>
                <th className="px-4 py-3 font-medium">{t("tablePassword")}</th>
                <th className="px-4 py-3 font-medium">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.students.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.fullName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{s.username}</td>
                  <td className="px-4 py-3">
                    <CopyableSecret value={s.passwordPlain} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeStudent(s._id)}
                      className="text-red-600 hover:underline"
                    >
                      {t("removeFromGroup")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

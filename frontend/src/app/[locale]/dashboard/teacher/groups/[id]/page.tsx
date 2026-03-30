"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { AppHeader } from "@/components/AppHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type GroupDetail = {
  _id: string;
  name: string;
  courseName: string;
  students: { _id: string; fullName: string; present?: boolean }[];
};

export default function TeacherGroupAttendancePage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("teacher");
  const td = useTranslations("dashboard");
  const ta = useTranslations("admin");
  const router = useRouter();
  const { user, loading, token } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const loadGroup = useCallback(
    (forDate: string) => {
      if (!id) return;
      const qs = new URLSearchParams({ date: new Date(forDate).toISOString() });
      apiFetch<GroupDetail>(`/api/teacher/groups/${id}?${qs}`, { token })
        .then((g) => {
          setGroup(g);
          const m: Record<string, boolean> = {};
          for (const s of g.students) {
            if (s.present !== undefined) m[s._id] = s.present;
            else m[s._id] = true;
          }
          setPresence(m);
        })
        .catch(() => setGroup(null));
    },
    [id, token]
  );

  useEffect(() => {
    if (!id || loading || !user || user.role !== "TEACHER") return;
    loadGroup(date);
  }, [id, date, loadGroup, loading, user]);

  async function onSave() {
    if (!group) return;
    setSaving(true);
    setMsg(null);
    try {
      const entries = group.students.map((s) => ({
        studentId: s._id,
        present: presence[s._id] ?? false,
      }));
      const res = await apiFetch<{ saved: number }>("/api/teacher/attendance/batch", {
        method: "POST",
        body: JSON.stringify({
          groupId: group._id,
          date: new Date(date).toISOString(),
          entries,
        }),
        token,
      });
      setMsg(t("savedCount", { count: res.saved }));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || user.role !== "TEACHER") return null;

  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <Link href="/dashboard/teacher" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← {t("backToGroups")}
        </Link>

        {!group ? (
          <p className="mt-8 text-[var(--muted)]">{td("loadError")}</p>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">{group.name}</h1>
            <p className="mt-1 text-[var(--muted)]">
              {t("courseLabel")}: {group.courseName}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div>
                <label className="label mb-1">{t("lessonDate")}</label>
                <input
                  type="date"
                  className="input-field !py-2"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-secondary !py-2 text-sm"
                onClick={() => {
                  const d = new Date().toISOString().slice(0, 10);
                  setDate(d);
                }}
              >
                {t("setToday")}
              </button>
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("groupAttendanceTitle")}</h2>
              {group.students.length === 0 ? (
                <p className="card-surface mt-4 p-6 text-[var(--muted)]">{t("noStudentsInGroup")}</p>
              ) : (
                <div className="card-surface mt-4 overflow-x-auto shadow-soft dark:shadow-soft-dark">
                  <table className="w-full min-w-[400px] text-left text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">{ta("tableName")}</th>
                        <th className="px-4 py-3 font-medium">{td("presentLabel")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {group.students.map((s) => (
                        <tr key={s._id}>
                          <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.fullName}</td>
                          <td className="px-4 py-3">
                            <label className="inline-flex cursor-pointer items-center gap-4">
                              <span className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`att-${s._id}`}
                                  checked={(presence[s._id] ?? true) === true}
                                  onChange={() => setPresence((p) => ({ ...p, [s._id]: true }))}
                                />
                                {td("presentLabel")}
                              </span>
                              <span className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`att-${s._id}`}
                                  checked={(presence[s._id] ?? true) === false}
                                  onChange={() => setPresence((p) => ({ ...p, [s._id]: false }))}
                                />
                                {td("absentLabel")}
                              </span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {group.students.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" disabled={saving} className="btn-primary" onClick={onSave}>
                    {t("saveAttendance")}
                  </button>
                  {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

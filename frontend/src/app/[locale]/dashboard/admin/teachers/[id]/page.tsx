"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CopyableSecret } from "@/components/CopyableSecret";

type Summary = {
  user: {
    _id: string;
    fullName: string;
    username: string;
    role: string;
    createdAt: string;
    passwordPlain?: string | null;
  };
  courses: { _id: string; name: string; description?: string }[];
  groups: { _id: string; name: string; courseName?: string; studentCount: number }[];
};

export default function TeacherDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("admin");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Summary>(`/api/users/${id}/summary`, { token })
      .then((s) => {
        setData(s);
        setFullName(s.user.fullName);
        setUsername(s.user.username);
      })
      .catch(() => setErr("load"))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      const body: Record<string, string> = { fullName, username };
      if (newPassword.length >= 8) body.newPassword = newPassword;
      await apiFetch(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        token,
      });
      setNewPassword("");
      setMsg("saved");
      const s = await apiFetch<Summary>(`/api/users/${id}/summary`, { token });
      setData(s);
    } catch {
      setErr("save");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Remove this teacher account?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE", token });
      router.push("/dashboard/admin/teachers");
    } catch {
      setErr("delete");
    }
  }

  if (loading) {
    return <p className="text-[var(--muted)]">{t("loading")}</p>;
  }
  if (err === "load" || !data) {
    return (
      <p className="text-red-600">
        {td("loadError")}{" "}
        <Link href="/dashboard/admin/teachers" className="link-muted">
          {t("teachersPageTitle")}
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/admin/teachers"
        className="mb-6 inline-block text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← {t("teachersPageTitle")}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{t("teacherDetailTitle")}</h1>

      {msg === "saved" && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-[var(--success-muted)] px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-200">
          {t("editSaved")}
        </p>
      )}
      {err === "save" && (
        <p className="mt-4 text-sm text-red-600">{t("saveFailed")}</p>
      )}
      {err === "delete" && (
        <p className="mt-4 text-sm text-red-600">{t("deleteFailed")}</p>
      )}

      <form onSubmit={onSave} className="card-surface mt-8 max-w-xl p-8 shadow-soft dark:shadow-soft-dark">
        <div>
          <label className="label" htmlFor="fullName">
            {t("fullName")}
          </label>
          <input
            id="fullName"
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="mt-5">
          <label className="label" htmlFor="username">
            {t("tableUsername")}
          </label>
          <input
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          {t("tableJoined")}: {new Date(data.user.createdAt).toLocaleString()}
        </p>
        <div className="mt-4 rounded-xl bg-[var(--background)]/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">{t("passwordLabel")}</p>
          <div className="mt-1">
            <CopyableSecret value={data.user.passwordPlain} />
          </div>
        </div>
        <div className="mt-5">
          <label className="label" htmlFor="newPw">
            {t("setNewPassword")}
          </label>
          <input
            id="newPw"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("newPasswordPlaceholder")}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {t("saveEdits")}
          </button>
          <button type="button" onClick={onDelete} className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
            {t("deleteUser")}
          </button>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("coursesHeading")}</h2>
        {data.courses.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">—</p>
        ) : (
          <ul className="card-surface mt-4 divide-y divide-[var(--border)]">
            {data.courses.map((c) => (
              <li key={c._id} className="px-5 py-4">
                <span className="font-medium text-[var(--foreground)]">{c.name}</span>
                {c.description && (
                  <p className="mt-1 text-sm text-[var(--muted)]">{c.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("groupsHeading")}</h2>
        {data.groups.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">—</p>
        ) : (
          <div className="card-surface mt-4 overflow-x-auto shadow-soft dark:shadow-soft-dark">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("groupColName")}</th>
                  <th className="px-4 py-3 font-medium">{t("courseColName")}</th>
                  <th className="px-4 py-3 font-medium">{t("studentCount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.groups.map((g) => (
                  <tr key={g._id}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{g.name}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{g.courseName ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--muted)]">{g.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiBase(): string {
  return API;
}

/** Binary download (Excel/PDF) with Bearer token. */
export async function downloadWithAuth(path: string, token: string | null, filename: string): Promise<void> {
  const t = token ?? getStoredToken();
  const res = await fetch(`${API}${path}`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("crm_token");
}

export function setStoredAuth(token: string, userJson: string): void {
  localStorage.setItem("crm_token", token);
  localStorage.setItem("crm_user", userJson);
}

export function clearStoredAuth(): void {
  localStorage.removeItem("crm_token");
  localStorage.removeItem("crm_user");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token: explicitToken, ...rest } = options;
  const token = explicitToken !== undefined ? explicitToken : getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || res.statusText) as Error & {
      status: number;
      body: unknown;
    };
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

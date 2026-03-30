export type DueCountdown =
  | { type: "paid" }
  | { type: "none" }
  | { type: "overdue" }
  | { type: "remaining"; days: number; hours: number; minutes: number };

export function getDueCountdown(dueAt: string | undefined, status: string): DueCountdown {
  if (status === "PAID" || status === "PARTIAL") return { type: "paid" };
  if (!dueAt) return { type: "none" };
  const end = new Date(dueAt).getTime();
  const now = Date.now();
  if (end < now) return { type: "overdue" };
  const ms = end - now;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return { type: "remaining", days, hours, minutes };
}

/**
 * Future-ready stubs for SMS and Telegram (event-based alerts).
 * Wire real providers via env in production.
 */

export type NotificationEvent =
  | { type: "MISSED_CLASS"; studentId: string; groupId: string }
  | { type: "PAYMENT_DUE"; studentId: string; amount: number }
  | { type: "HOMEWORK_ASSIGNED"; studentId: string; homeworkId: string };

export async function dispatchNotification(
  _event: NotificationEvent,
  _centerId: string
): Promise<void> {
  // TODO: integrate SMS provider / Telegram Bot API
}

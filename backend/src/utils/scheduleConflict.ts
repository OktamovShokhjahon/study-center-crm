import { IScheduleSlot } from "../models/Group";

function overlaps(a: IScheduleSlot, b: IScheduleSlot): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/** Returns true if adding `slot` conflicts with any slot in `existing` */
export function hasConflict(existing: IScheduleSlot[], slot: IScheduleSlot): boolean {
  return existing.some((s) => overlaps(s, slot));
}

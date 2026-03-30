import { Types } from "mongoose";
import { Group } from "../models/Group";
import { Course } from "../models/Course";
import { Payment } from "../models/Payment";

/** New tuition installments are due 30 days after enrollment (end of that day, local). */
export function defaultDueAtFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Creates a PENDING payment for course price when a student joins a group.
 * Skips if course price is 0 or an open tuition payment already exists for this student+group.
 */
export async function ensureTuitionPaymentForGroupEnrollment(opts: {
  studentId: Types.ObjectId;
  groupId: Types.ObjectId;
  centerId: Types.ObjectId;
  recordedBy: Types.ObjectId;
}): Promise<void> {
  const group = await Group.findOne({
    _id: opts.groupId,
    centerId: opts.centerId,
  });
  if (!group) return;

  const course = await Course.findOne({
    _id: group.courseId,
    centerId: opts.centerId,
  });
  if (!course || (course.price ?? 0) <= 0) return;

  const existing = await Payment.findOne({
    studentId: opts.studentId,
    groupId: opts.groupId,
    centerId: opts.centerId,
    status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
  });
  if (existing) return;

  await Payment.create({
    studentId: opts.studentId,
    centerId: opts.centerId,
    amount: course.price,
    currency: course.currency || "UZS",
    status: "PENDING",
    recordedBy: opts.recordedBy,
    dueAt: defaultDueAtFromNow(),
    groupId: group._id,
    courseId: course._id,
    notes: `Tuition: ${course.name}`,
  });
}

import { User } from "../models/User";
import { Types } from "mongoose";

function slugifyName(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\s.-]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "") || "student";
}

async function uniqueUsername(base: string, centerId: Types.ObjectId): Promise<string> {
  let candidate = base;
  let n = 0;
  while (await User.findOne({ username: candidate, centerId })) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

export async function generateStudentUsername(
  fullName: string,
  centerId: Types.ObjectId
): Promise<string> {
  const slug = slugifyName(fullName);
  return uniqueUsername(slug, centerId);
}

export async function generateParentUsername(
  studentUsername: string,
  parentIndex: 1 | 2,
  centerId: Types.ObjectId
): Promise<string> {
  const base = `${studentUsername}.p${parentIndex}`;
  return uniqueUsername(base, centerId);
}

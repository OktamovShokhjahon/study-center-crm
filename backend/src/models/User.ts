import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  centerId: Types.ObjectId;
  /** For PARENT: linked student user id */
  studentId?: Types.ObjectId | null;
  /** For STUDENT: parent user ids */
  parentUserIds?: Types.ObjectId[];
  language?: "uz" | "en" | "ru";
  theme?: "light" | "dark";
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  /** Plaintext copy for admin visibility only — updated when password is set/changed */
  passwordPlain?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      required: true,
    },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    parentUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    language: { type: String, enum: ["uz", "en", "ru"], default: "uz" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    passwordPlain: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ centerId: 1, username: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);

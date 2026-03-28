import mongoose, { Schema, Types } from "mongoose";

export interface IAttendance {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  studentId: Types.ObjectId;
  date: Date;
  present: boolean;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    present: { type: Boolean, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ groupId: 1, studentId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);

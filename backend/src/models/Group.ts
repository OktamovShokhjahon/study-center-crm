import mongoose, { Schema, Types } from "mongoose";

export interface IScheduleSlot {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  room?: string;
}

export interface IGroup {
  _id: Types.ObjectId;
  name: string;
  courseId: Types.ObjectId;
  centerId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  schedule: IScheduleSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true },
    room: { type: String },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    schedule: [ScheduleSlotSchema],
  },
  { timestamps: true }
);

export const Group = mongoose.model<IGroup>("Group", GroupSchema);

import mongoose, { Schema, Types } from "mongoose";

export interface ICourse {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  centerId: Types.ObjectId;
  teacherId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>("Course", CourseSchema);

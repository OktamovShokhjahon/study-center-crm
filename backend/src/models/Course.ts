import mongoose, { Schema, Types } from "mongoose";

export interface ICourse {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  currency: string;
  centerId: Types.ObjectId;
  teacherId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: "UZS", trim: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>("Course", CourseSchema);

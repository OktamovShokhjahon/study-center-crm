import mongoose, { Schema, Types } from "mongoose";

export interface IGrade {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  score: number;
  maxScore: number;
  feedback?: string;
  gradedBy: Types.ObjectId;
  centerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  },
  { timestamps: true }
);

export const Grade = mongoose.model<IGrade>("Grade", GradeSchema);

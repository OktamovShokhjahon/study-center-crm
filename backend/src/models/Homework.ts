import mongoose, { Schema, Types } from "mongoose";

export interface IHomework {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  title: string;
  description?: string;
  dueAt?: Date;
  createdBy: Types.ObjectId;
  centerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkSchema = new Schema<IHomework>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
  },
  { timestamps: true }
);

export const Homework = mongoose.model<IHomework>("Homework", HomeworkSchema);

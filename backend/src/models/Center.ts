import mongoose, { Schema, Types } from "mongoose";

export interface ICenter {
  _id: Types.ObjectId;
  name: string;
  subdomain: string;
  createdAt: Date;
  updatedAt: Date;
}

const CenterSchema = new Schema<ICenter>(
  {
    name: { type: String, required: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export const Center = mongoose.model<ICenter>("Center", CenterSchema);

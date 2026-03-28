import mongoose, { Schema, Types } from "mongoose";

export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";

export interface IPayment {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  centerId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  discountAmount?: number;
  promoCode?: string;
  notes?: string;
  recordedBy: Types.ObjectId;
  paidAt?: Date;
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "UZS" },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIAL", "OVERDUE"],
      default: "PENDING",
    },
    discountAmount: { type: Number, default: 0 },
    promoCode: { type: String },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date },
    dueAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

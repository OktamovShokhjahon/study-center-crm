import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Payment, PaymentStatus } from "../models/Payment";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

export function createPaymentsRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get("/", query("studentId").optional().isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const filter: Record<string, unknown> = { centerId: req.auth.centerId };
    if (req.query?.studentId) filter.studentId = req.query.studentId;
    const list = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .populate("studentId", "fullName username")
      .populate("groupId", "name")
      .populate("courseId", "name price")
      .lean();
    res.json(list);
  });

  router.post(
    "/",
    body("studentId").isMongoId(),
    body("amount").isFloat({ min: 0 }),
    body("status").isIn(["PENDING", "PAID", "PARTIAL", "OVERDUE"]),
    body("discountAmount").optional().isFloat({ min: 0 }),
    body("promoCode").optional().trim(),
    body("dueAt").optional().isISO8601(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const student = await User.findOne({
        _id: req.body.studentId,
        centerId: req.auth.centerId,
        role: "STUDENT",
      });
      if (!student) {
        res.status(400).json({ error: "Invalid student" });
        return;
      }
      const status = req.body.status as PaymentStatus;
      const paidAt =
        status === "PAID" || status === "PARTIAL" ? new Date() : undefined;
      const p = await Payment.create({
        studentId: student._id,
        centerId: new Types.ObjectId(req.auth.centerId),
        amount: req.body.amount,
        status,
        discountAmount: req.body.discountAmount ?? 0,
        promoCode: req.body.promoCode,
        recordedBy: new Types.ObjectId(req.auth.sub),
        dueAt: req.body.dueAt ? new Date(req.body.dueAt) : undefined,
        paidAt,
      });
      res.status(201).json(p);
    }
  );

  router.patch(
    "/:id",
    param("id").isMongoId(),
    body("status").optional().isIn(["PENDING", "PAID", "PARTIAL", "OVERDUE"]),
    body("amount").optional().isFloat({ min: 0 }),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const payment = await Payment.findOne({
        _id: req.params!.id,
        centerId: req.auth.centerId,
      });
      if (!payment) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (req.body.amount !== undefined) payment.amount = req.body.amount;
      if (req.body.status) {
        payment.status = req.body.status;
        if (req.body.status === "PAID" || req.body.status === "PARTIAL") {
          payment.paidAt = new Date();
        } else if (req.body.status === "PENDING" || req.body.status === "OVERDUE") {
          payment.paidAt = undefined;
        }
      }
      await payment.save();
      res.json(payment);
    }
  );

  return router;
}

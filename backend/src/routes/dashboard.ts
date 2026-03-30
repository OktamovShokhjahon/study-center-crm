import { Router, Response } from "express";
import { query, validationResult } from "express-validator";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Payment } from "../models/Payment";
import { Center } from "../models/Center";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { buildIncomePdf, buildIncomeXlsx, fetchPaidPaymentsInRange } from "../services/incomeExport";
import { Course } from "../models/Course";

export function createDashboardRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get("/admin", async (req, res: Response) => {
    if (!req.auth) return;
    const centerOid = new Types.ObjectId(req.auth.centerId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    const activeStudents = await User.countDocuments({ centerId: centerOid, role: "STUDENT" });

    const newRegistrations = await User.countDocuments({
      centerId: centerOid,
      role: "STUDENT",
      createdAt: { $gte: startOfDay },
    });

    const todayPayments = await Payment.aggregate([
      {
        $match: {
          centerId: centerOid,
          status: "PAID",
          paidAt: { $gte: startOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const dailyRevenue = todayPayments[0]?.total ?? 0;

    const debtAgg = await Payment.aggregate([
      {
        $match: {
          centerId: centerOid,
          status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const outstandingPayments = debtAgg[0]?.total ?? 0;

    const overdueAgg = await Payment.aggregate([
      {
        $match: {
          centerId: centerOid,
          status: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
          dueAt: { $lt: now },
        },
      },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]);
    const overdueCount = overdueAgg[0]?.count ?? 0;
    const overdueAmount = overdueAgg[0]?.total ?? 0;

    const teacherCount = await User.countDocuments({ centerId: centerOid, role: "TEACHER" });
    const recentTeachers = await User.find({ centerId: centerOid, role: "TEACHER" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("fullName username updatedAt")
      .lean();

    res.json({
      dailyRevenue,
      activeStudents,
      outstandingPayments,
      newRegistrations,
      overdueCount,
      overdueAmount,
      teacherActivity: {
        totalTeachers: teacherCount,
        recent: recentTeachers,
      },
    });
  });

  router.get(
    "/admin/revenue-series",
    query("from").isISO8601(),
    query("to").isISO8601(),
    query("bucket").optional().isIn(["day", "week", "month"]),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const centerOid = new Types.ObjectId(req.auth.centerId);
      const q = req.query as { from: string; to: string; bucket?: string };
      const from = new Date(q.from);
      const to = new Date(q.to);
      to.setHours(23, 59, 59, 999);
      const bucket = q.bucket || "day";
      const unit = bucket === "week" ? "week" : bucket === "month" ? "month" : "day";

      const series = await Payment.aggregate([
        {
          $match: {
            centerId: centerOid,
            status: "PAID",
            paidAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: { $dateTrunc: { date: "$paidAt", unit: unit as "day" | "week" | "month" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: { $dateToString: { format: "%Y-%m-%d", date: "$_id" } },
            total: 1,
          },
        },
      ]);

      res.json({ series });
    }
  );

  router.get(
    "/admin/revenue-by-course",
    query("from").isISO8601(),
    query("to").isISO8601(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const centerOid = new Types.ObjectId(req.auth.centerId);
      const q = req.query as { from: string; to: string };
      const from = new Date(q.from);
      const to = new Date(q.to);
      to.setHours(23, 59, 59, 999);

      const rows = await Payment.aggregate([
        {
          $match: {
            centerId: centerOid,
            status: "PAID",
            paidAt: { $gte: from, $lte: to },
            courseId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$courseId",
            total: { $sum: "$amount" },
          },
        },
      ]);

      const courseIds = rows.map((r) => r._id).filter(Boolean);
      const courses = await Course.find({ _id: { $in: courseIds } })
        .select("name")
        .lean();
      const nameById = new Map(courses.map((c) => [c._id.toString(), c.name]));

      res.json({
        breakdown: rows.map((r) => ({
          courseId: r._id,
          courseName: nameById.get(String(r._id)) ?? "—",
          total: r.total,
        })),
      });
    }
  );

  router.get(
    "/admin/income-export",
    query("from").isISO8601(),
    query("to").isISO8601(),
    query("format").isIn(["xlsx", "pdf"]),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const centerOid = new Types.ObjectId(req.auth.centerId);
      const q = req.query as { from: string; to: string; format: string };
      const from = new Date(q.from);
      const to = new Date(q.to);
      to.setHours(23, 59, 59, 999);
      const format = q.format;

      const center = await Center.findById(centerOid).select("name").lean();
      const centerName = center?.name ?? "Center";

      if (format === "xlsx") {
        const buf = await buildIncomeXlsx(centerOid, from, to);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="income-${from.toISOString().slice(0, 10)}.xlsx"`);
        res.send(buf);
        return;
      }

      const rows = await fetchPaidPaymentsInRange(centerOid, from, to);
      const pdfBuf = await buildIncomePdf(centerName, from, to, rows);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="income-${from.toISOString().slice(0, 10)}.pdf"`);
      res.send(pdfBuf);
    }
  );

  return router;
}

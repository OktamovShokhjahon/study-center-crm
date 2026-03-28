import { Router, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Payment } from "../models/Payment";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

export function createDashboardRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get("/admin", async (req, res: Response) => {
    if (!req.auth) return;
    const centerOid = new Types.ObjectId(req.auth.centerId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

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
      teacherActivity: {
        totalTeachers: teacherCount,
        recent: recentTeachers,
      },
    });
  });

  return router;
}

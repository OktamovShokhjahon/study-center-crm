import { Router, Response } from "express";
import { Types } from "mongoose";
import { Group } from "../models/Group";
import { Course } from "../models/Course";
import { Attendance } from "../models/Attendance";
import { Homework } from "../models/Homework";
import { Grade } from "../models/Grade";
import { Payment } from "../models/Payment";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function createStudentPortalRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("STUDENT"));

  router.get("/schedule", async (req, res: Response) => {
    if (!req.auth) return;
    const sid = new Types.ObjectId(req.auth.sub);
    const groups = await Group.find({
      centerId: req.auth.centerId,
      studentIds: sid,
    })
      .populate("courseId", "name")
      .lean();

    const schedule = groups.flatMap((g) =>
      (g.schedule || []).map((slot) => ({
        groupName: g.name,
        course: (g.courseId as { name?: string })?.name,
        dayLabel: DAYS[slot.dayOfWeek] ?? String(slot.dayOfWeek),
        dayOfWeek: slot.dayOfWeek,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        room: slot.room,
      }))
    );
    res.json({ schedule });
  });

  router.get("/attendance", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await Attendance.find({ studentId: req.auth.sub })
      .sort({ date: -1 })
      .limit(60)
      .populate("groupId", "name")
      .lean();
    res.json(list);
  });

  router.get("/homework", async (req, res: Response) => {
    if (!req.auth) return;
    const sid = new Types.ObjectId(req.auth.sub);
    const groups = await Group.find({
      centerId: req.auth.centerId,
      studentIds: sid,
    }).select("_id");
    const gids = groups.map((g) => g._id);
    const list = await Homework.find({ groupId: { $in: gids } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  });

  router.get("/grades", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await Grade.find({ studentId: req.auth.sub })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  });

  router.get("/payments", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await Payment.find({
      centerId: req.auth.centerId,
      studentId: req.auth.sub,
    })
      .sort({ createdAt: -1 })
      .populate("groupId", "name")
      .populate("courseId", "name")
      .lean();
    res.json(list);
  });

  return router;
}

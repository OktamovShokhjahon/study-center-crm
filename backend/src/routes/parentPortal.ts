import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { Attendance } from "../models/Attendance";
import { Grade } from "../models/Grade";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

export function createParentPortalRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("PARENT"));

  router.get("/child-overview", async (req, res: Response) => {
    if (!req.auth) return;
    const parent = await User.findById(req.auth.sub);
    if (!parent?.studentId) {
      res.status(400).json({ error: "No linked student" });
      return;
    }
    const student = await User.findById(parent.studentId).select("fullName username");
    const attendance = await Attendance.find({ studentId: parent.studentId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    const grades = await Grade.find({ studentId: parent.studentId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ student, attendance, grades });
  });

  router.post(
    "/message-teacher",
    body("teacherId").isMongoId(),
    body("message").trim().notEmpty(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const parent = await User.findById(req.auth.sub);
      if (!parent?.studentId) {
        res.status(400).json({ error: "No linked student" });
        return;
      }
      const teacher = await User.findOne({
        _id: req.body.teacherId,
        centerId: req.auth.centerId,
        role: "TEACHER",
      });
      if (!teacher) {
        res.status(404).json({ error: "Teacher not found" });
        return;
      }
      // Placeholder: persist to Message model when added; for now echo + notification stub
      res.status(201).json({
        delivered: true,
        to: teacher.fullName,
        preview: (req.body.message as string).slice(0, 200),
      });
    }
  );

  return router;
}

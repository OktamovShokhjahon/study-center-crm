import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Group, IScheduleSlot } from "../models/Group";
import { Course } from "../models/Course";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { hasConflict } from "../utils/scheduleConflict";
import { ensureTuitionPaymentForGroupEnrollment } from "../services/tuition";

export function createGroupsRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get("/", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await Group.find({ centerId: req.auth.centerId })
      .populate({
        path: "courseId",
        select: "name teacherId",
        populate: { path: "teacherId", select: "fullName username" },
      })
      .sort({ name: 1 })
      .lean();
    res.json(list);
  });

  router.get("/:id", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const group = await Group.findOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
    })
      .populate({
        path: "courseId",
        select: "name teacherId",
        populate: { path: "teacherId", select: "fullName username +passwordPlain" },
      })
      .lean();
    if (!group) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const course = group.courseId as {
      name?: string;
      teacherId?: Record<string, unknown> | import("mongoose").Types.ObjectId;
    };
    const teacher =
      course?.teacherId && typeof course.teacherId === "object" && "_id" in course.teacherId
        ? course.teacherId
        : null;
    const students = await User.find({
      _id: { $in: group.studentIds || [] },
      centerId: req.auth.centerId,
      role: "STUDENT",
    })
      .select("fullName username +passwordPlain")
      .sort({ fullName: 1 })
      .lean();
    res.json({
      _id: group._id,
      name: group.name,
      schedule: group.schedule,
      courseId: course,
      courseName: course?.name,
      teacher,
      students,
    });
  });

  router.post(
    "/",
    body("name").trim().notEmpty(),
    body("courseId").isMongoId(),
    body("schedule").optional().isArray(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const course = await Course.findOne({
        _id: req.body.courseId,
        centerId: req.auth.centerId,
      });
      if (!course) {
        res.status(400).json({ error: "Invalid course" });
        return;
      }
      const schedule = (req.body.schedule || []) as IScheduleSlot[];
      for (let i = 0; i < schedule.length; i++) {
        const slot = schedule[i]!;
        const rest = schedule.filter((_, j) => j !== i);
        if (hasConflict(rest, slot)) {
          res.status(400).json({ error: "Schedule conflict within this group" });
          return;
        }
      }
      const group = await Group.create({
        name: req.body.name,
        courseId: course._id,
        centerId: new Types.ObjectId(req.auth.centerId),
        studentIds: [],
        schedule,
      });
      res.status(201).json(group);
    }
  );

  router.patch(
    "/:id",
    param("id").isMongoId(),
    body("name").optional().trim().notEmpty(),
    body("schedule").optional().isArray(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.params!.id,
        centerId: req.auth.centerId,
      });
      if (!group) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (req.body.name) group.name = req.body.name;
      if (req.body.schedule) {
        const schedule = req.body.schedule as IScheduleSlot[];
        for (let i = 0; i < schedule.length; i++) {
          const slot = schedule[i]!;
          const rest = schedule.filter((_, j) => j !== i);
          if (hasConflict(rest, slot)) {
            res.status(400).json({ error: "Schedule conflict within this group" });
            return;
          }
        }
        group.schedule = schedule;
      }
      await group.save();
      res.json(group);
    }
  );

  router.post(
    "/:id/students",
    param("id").isMongoId(),
    body("studentId").isMongoId(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.params!.id,
        centerId: req.auth.centerId,
      });
      if (!group) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const student = await User.findOne({
        _id: req.body.studentId,
        centerId: req.auth.centerId,
        role: "STUDENT",
      });
      if (!student) {
        res.status(400).json({ error: "Invalid student" });
        return;
      }
      if (!group.studentIds.some((id) => id.equals(student._id))) {
        group.studentIds.push(student._id);
        await group.save();
        await ensureTuitionPaymentForGroupEnrollment({
          studentId: student._id,
          groupId: group._id,
          centerId: new Types.ObjectId(req.auth.centerId),
          recordedBy: new Types.ObjectId(req.auth.sub),
        });
      }
      res.json(group);
    }
  );

  router.delete("/:id/students/:studentId", async (req, res: Response) => {
    if (!req.auth) return;
    const group = await Group.findOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
    });
    if (!group) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    group.studentIds = group.studentIds.filter((id) => id.toString() !== req.params!.studentId);
    await group.save();
    res.json(group);
  });

  router.delete("/:id", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const result = await Group.deleteOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
    });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  });

  return router;
}

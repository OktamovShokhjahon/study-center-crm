import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Group } from "../models/Group";
import { Course } from "../models/Course";
import { Attendance } from "../models/Attendance";
import { Homework } from "../models/Homework";
import { Grade } from "../models/Grade";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

export function createTeacherRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("TEACHER"));

  router.get("/groups", async (req, res: Response) => {
    if (!req.auth) return;
    const courses = await Course.find({
      centerId: req.auth.centerId,
      teacherId: req.auth.sub,
    }).select("_id");
    const courseIds = courses.map((c) => c._id);
    const groups = await Group.find({ courseId: { $in: courseIds } })
      .populate("courseId", "name")
      .lean();
    res.json(groups);
  });

  router.post(
    "/attendance",
    body("groupId").isMongoId(),
    body("studentId").isMongoId(),
    body("date").isISO8601(),
    body("present").isBoolean(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.body.groupId,
        centerId: req.auth.centerId,
      });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      const course = await Course.findOne({
        _id: group.courseId,
        teacherId: req.auth.sub,
      });
      if (!course) {
        res.status(403).json({ error: "Not your group" });
        return;
      }
      const date = new Date(req.body.date);
      date.setHours(0, 0, 0, 0);
      const att = await Attendance.findOneAndUpdate(
        {
          groupId: group._id,
          studentId: req.body.studentId,
          date,
        },
        {
          present: req.body.present,
          recordedBy: new Types.ObjectId(req.auth.sub),
        },
        { upsert: true, new: true }
      );
      res.json(att);
    }
  );

  router.post(
    "/homework",
    body("groupId").isMongoId(),
    body("title").trim().notEmpty(),
    body("description").optional().trim(),
    body("dueAt").optional().isISO8601(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.body.groupId,
        centerId: req.auth.centerId,
      });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      const course = await Course.findOne({
        _id: group.courseId,
        teacherId: req.auth.sub,
      });
      if (!course) {
        res.status(403).json({ error: "Not your group" });
        return;
      }
      const hw = await Homework.create({
        groupId: group._id,
        title: req.body.title,
        description: req.body.description,
        dueAt: req.body.dueAt ? new Date(req.body.dueAt) : undefined,
        createdBy: new Types.ObjectId(req.auth.sub),
        centerId: new Types.ObjectId(req.auth.centerId),
      });
      res.status(201).json(hw);
    }
  );

  router.post(
    "/grades",
    body("groupId").isMongoId(),
    body("studentId").isMongoId(),
    body("title").trim().notEmpty(),
    body("score").isFloat({ min: 0 }),
    body("maxScore").isFloat({ min: 0 }),
    body("feedback").optional().trim(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.body.groupId,
        centerId: req.auth.centerId,
      });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      const course = await Course.findOne({
        _id: group.courseId,
        teacherId: req.auth.sub,
      });
      if (!course) {
        res.status(403).json({ error: "Not your group" });
        return;
      }
      const g = await Grade.create({
        studentId: new Types.ObjectId(req.body.studentId),
        groupId: group._id,
        title: req.body.title,
        score: req.body.score,
        maxScore: req.body.maxScore,
        feedback: req.body.feedback,
        gradedBy: new Types.ObjectId(req.auth.sub),
        centerId: new Types.ObjectId(req.auth.centerId),
      });
      res.status(201).json(g);
    }
  );

  return router;
}

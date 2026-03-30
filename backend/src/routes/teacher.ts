import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
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

  router.get(
    "/groups/:groupId",
    param("groupId").isMongoId(),
    query("date").optional().isISO8601(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const group = await Group.findOne({
        _id: req.params!.groupId,
        centerId: req.auth.centerId,
      }).lean();
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
      const students = await User.find({
        _id: { $in: group.studentIds || [] },
        centerId: req.auth.centerId,
        role: "STUDENT",
      })
        .select("fullName")
        .sort({ fullName: 1 })
        .lean();

      let attendanceByStudent: Record<string, boolean> = {};
      const dateStr = (req.query as { date?: string }).date;
      if (dateStr) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const atts = await Attendance.find({
          groupId: group._id,
          date,
        }).lean();
        attendanceByStudent = Object.fromEntries(
          atts.map((a) => [a.studentId.toString(), a.present])
        );
      }

      res.json({
        _id: group._id,
        name: group.name,
        schedule: group.schedule,
        courseName: course.name,
        students: students.map((s) => ({
          _id: s._id,
          fullName: s.fullName,
          present:
            attendanceByStudent[s._id.toString()] !== undefined
              ? attendanceByStudent[s._id.toString()]
              : undefined,
        })),
      });
    }
  );

  router.post(
    "/attendance/batch",
    body("groupId").isMongoId(),
    body("date").isISO8601(),
    body("entries").isArray({ min: 1 }),
    body("entries.*.studentId").isMongoId(),
    body("entries.*.present").isBoolean(),
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
      const date = new Date(req.body.date as string);
      date.setHours(0, 0, 0, 0);
      const allowed = new Set((group.studentIds || []).map((id) => id.toString()));
      const results = [];
      for (const e of req.body.entries as { studentId: string; present: boolean }[]) {
        if (!allowed.has(e.studentId)) continue;
        const att = await Attendance.findOneAndUpdate(
          {
            groupId: group._id,
            studentId: e.studentId,
            date,
          },
          {
            present: e.present,
            recordedBy: new Types.ObjectId(req.auth.sub),
          },
          { upsert: true, new: true }
        );
        results.push(att);
      }
      res.json({ saved: results.length });
    }
  );

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

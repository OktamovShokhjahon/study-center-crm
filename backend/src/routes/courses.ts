import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Course } from "../models/Course";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

export function createCoursesRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get("/", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await Course.find({ centerId: req.auth.centerId })
      .populate({
        path: "teacherId",
        select: "fullName username +passwordPlain",
      })
      .sort({ name: 1 })
      .lean();
    res.json(list);
  });

  router.post(
    "/",
    body("name").trim().notEmpty(),
    body("teacherId").isMongoId(),
    body("description").optional().trim(),
    body("price").isFloat({ min: 0 }),
    body("currency").optional().trim().isLength({ min: 1, max: 8 }),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const teacher = await User.findOne({
        _id: req.body.teacherId,
        centerId: req.auth.centerId,
        role: "TEACHER",
      });
      if (!teacher) {
        res.status(400).json({ error: "Invalid teacher" });
        return;
      }
      const course = await Course.create({
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        currency: (req.body.currency as string | undefined)?.trim() || "UZS",
        centerId: new Types.ObjectId(req.auth.centerId),
        teacherId: teacher._id,
      });
      res.status(201).json(course);
    }
  );

  router.patch(
    "/:id",
    param("id").isMongoId(),
    body("name").optional().trim().notEmpty(),
    body("teacherId").optional().isMongoId(),
    body("price").optional().isFloat({ min: 0 }),
    body("currency").optional().trim().isLength({ min: 1, max: 8 }),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const course = await Course.findOne({
        _id: req.params!.id,
        centerId: req.auth.centerId,
      });
      if (!course) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (req.body.name) course.name = req.body.name;
      if (req.body.description !== undefined) course.description = req.body.description;
      if (req.body.price !== undefined) course.price = Number(req.body.price);
      if (req.body.currency !== undefined) course.currency = String(req.body.currency).trim();
      if (req.body.teacherId) {
        const teacher = await User.findOne({
          _id: req.body.teacherId,
          centerId: req.auth.centerId,
          role: "TEACHER",
        });
        if (!teacher) {
          res.status(400).json({ error: "Invalid teacher" });
          return;
        }
        course.teacherId = teacher._id;
      }
      await course.save();
      res.json(course);
    }
  );

  router.delete("/:id", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const result = await Course.deleteOne({
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

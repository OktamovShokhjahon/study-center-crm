import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { Types } from "mongoose";
import { User, UserRole } from "../models/User";
import { Course } from "../models/Course";
import { Group } from "../models/Group";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { hashPassword, generateRandomPassword } from "../utils/password";

export function createUsersRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.get(
    "/",
    query("role").optional().isIn(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const filter: { centerId: string; role?: UserRole } = {
        centerId: req.auth.centerId,
      };
      const role = req.query?.role as UserRole | undefined;
      if (role) filter.role = role;
      const users = await User.find(filter)
        .select("-passwordHash -passwordResetToken -passwordResetExpires +passwordPlain")
        .sort({ createdAt: -1 })
        .lean();
      res.json(users);
    }
  );

  router.post(
    "/",
    body("fullName").trim().notEmpty(),
    body("username").trim().notEmpty(),
    body("role").isIn(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const { fullName, username, role } = req.body as {
        fullName: string;
        username: string;
        role: UserRole;
      };
      const exists = await User.findOne({
        username: username.toLowerCase(),
        centerId: req.auth.centerId,
      });
      if (exists) {
        res.status(409).json({ error: "Username already taken in this center" });
        return;
      }
      const plain = generateRandomPassword(12);
      const passwordHash = await hashPassword(plain);
      const user = await User.create({
        fullName,
        username: username.toLowerCase().trim(),
        passwordHash,
        passwordPlain: plain,
        role,
        centerId: new Types.ObjectId(req.auth.centerId),
      });
      res.status(201).json({
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        temporaryPassword: plain,
        passwordPlain: plain,
      });
    }
  );

  router.patch(
    "/:id",
    param("id").isMongoId(),
    body("fullName").optional().trim().notEmpty(),
    body("username").optional().trim().notEmpty(),
    body("role").optional().isIn(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
    body("newPassword").optional().isLength({ min: 8 }),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const user = await User.findOne({
        _id: req.params!.id,
        centerId: req.auth.centerId,
      });
      if (!user) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (req.body.fullName) user.fullName = req.body.fullName;
      if (req.body.role) user.role = req.body.role;
      if (req.body.username) {
        const u = String(req.body.username).toLowerCase().trim();
        const taken = await User.findOne({
          username: u,
          centerId: req.auth.centerId,
          _id: { $ne: user._id },
        });
        if (taken) {
          res.status(409).json({ error: "Username already taken in this center" });
          return;
        }
        user.username = u;
      }
      if (req.body.newPassword) {
        const np = String(req.body.newPassword);
        user.passwordHash = await hashPassword(np);
        user.passwordPlain = np;
      }
      await user.save();
      res.json({
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        passwordPlain: user.passwordPlain,
      });
    }
  );

  /** Teacher: courses + groups. Admin only. */
  router.get("/:id/summary", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const user = await User.findOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
      role: "TEACHER",
    })
      .select("-passwordHash -passwordResetToken -passwordResetExpires +passwordPlain")
      .lean();
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const courses = await Course.find({
      centerId: req.auth.centerId,
      teacherId: user._id,
    })
      .select("name description createdAt")
      .sort({ name: 1 })
      .lean();
    const courseIds = courses.map((c) => c._id);
    const groups = await Group.find({
      centerId: req.auth.centerId,
      courseId: { $in: courseIds },
    })
      .populate("courseId", "name")
      .select("name courseId studentIds")
      .sort({ name: 1 })
      .lean();
    res.json({
      user,
      courses,
      groups: groups.map((g) => ({
        _id: g._id,
        name: g.name,
        courseName: (g.courseId as { name?: string })?.name,
        studentCount: (g.studentIds || []).length,
      })),
    });
  });

  router.delete("/:id", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    if (req.params!.id === req.auth.sub) {
      res.status(400).json({ error: "Cannot delete yourself" });
      return;
    }
    const result = await User.deleteOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
    });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  });

  router.get("/:id", param("id").isMongoId(), async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    if (!req.auth) return;
    const user = await User.findOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
    })
      .select("-passwordHash -passwordResetToken -passwordResetExpires +passwordPlain")
      .lean();
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(user);
  });

  return router;
}

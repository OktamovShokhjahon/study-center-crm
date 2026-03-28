import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Center } from "../models/Center";
import { Group } from "../models/Group";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { hashPassword, generateRandomPassword } from "../utils/password";
import { generateStudentUsername, generateParentUsername } from "../utils/username";
import { buildLoginCardPdf } from "../services/loginCardPdf";

export function createStudentsRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));
  router.use(requireRoles("ADMIN"));

  router.post(
    "/",
    body("fullName").trim().notEmpty(),
    body("groupId").optional().isMongoId(),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const centerId = new Types.ObjectId(req.auth.centerId);
      const { fullName, groupId } = req.body as { fullName: string; groupId?: string };

      const center = await Center.findById(centerId);
      if (!center) {
        res.status(404).json({ error: "Center not found" });
        return;
      }

      const studentUsername = await generateStudentUsername(fullName, centerId);
      const p1Username = await generateParentUsername(studentUsername, 1, centerId);
      const p2Username = await generateParentUsername(studentUsername, 2, centerId);

      const studentPass = generateRandomPassword(10);
      const parent1Pass = generateRandomPassword(8);
      const parent2Pass = generateRandomPassword(8);

      const studentUser = await User.create({
        fullName,
        username: studentUsername,
        passwordHash: await hashPassword(studentPass),
        passwordPlain: studentPass,
        role: "STUDENT",
        centerId,
        parentUserIds: [],
      });

      const parent1 = await User.create({
        fullName: `${fullName} (Parent 1)`,
        username: p1Username,
        passwordHash: await hashPassword(parent1Pass),
        passwordPlain: parent1Pass,
        role: "PARENT",
        centerId,
        studentId: studentUser._id,
      });
      const parent2 = await User.create({
        fullName: `${fullName} (Parent 2)`,
        username: p2Username,
        passwordHash: await hashPassword(parent2Pass),
        passwordPlain: parent2Pass,
        role: "PARENT",
        centerId,
        studentId: studentUser._id,
      });

      studentUser.parentUserIds = [parent1._id, parent2._id];
      await studentUser.save();

      if (groupId) {
        const group = await Group.findOne({ _id: groupId, centerId });
        if (group) {
          if (!group.studentIds.some((id) => id.equals(studentUser._id))) {
            group.studentIds.push(studentUser._id);
            await group.save();
          }
        }
      }

      const pdfBuffer = await buildLoginCardPdf({
        studentName: fullName,
        studentLogin: studentUsername,
        studentPassword: studentPass,
        parent1Login: p1Username,
        parent1Password: parent1Pass,
        parent2Login: p2Username,
        parent2Password: parent2Pass,
        centerName: center.name,
      });

      res.status(201).json({
        student: {
          id: studentUser._id,
          fullName: studentUser.fullName,
          username: studentUser.username,
        },
        credentials: {
          student: { username: studentUsername, password: studentPass },
          parent1: { username: p1Username, password: parent1Pass },
          parent2: { username: p2Username, password: parent2Pass },
        },
        pdfBase64: pdfBuffer.toString("base64"),
        message: "Store credentials securely. They are not retrievable again.",
      });
    }
  );

  router.get("/", async (req, res: Response) => {
    if (!req.auth) return;
    const list = await User.find({
      centerId: req.auth.centerId,
      role: "STUDENT",
    })
      .select("fullName username createdAt parentUserIds +passwordPlain")
      .sort({ createdAt: -1 })
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
    const student = await User.findOne({
      _id: req.params!.id,
      centerId: req.auth.centerId,
      role: "STUDENT",
    })
      .select("-passwordHash -passwordResetToken -passwordResetExpires +passwordPlain")
      .lean();
    if (!student) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const parentIds = student.parentUserIds || [];
    const parents = await User.find({
      _id: { $in: parentIds },
      role: "PARENT",
      centerId: req.auth.centerId,
    })
      .select("fullName username +passwordPlain")
      .lean();
    const groups = await Group.find({
      centerId: req.auth.centerId,
      studentIds: student._id,
    })
      .populate("courseId", "name")
      .select("name courseId")
      .sort({ name: 1 })
      .lean();
    res.json({
      ...student,
      parents,
      groups: groups.map((g) => ({
        _id: g._id,
        name: g.name,
        courseName: (g.courseId as { name?: string })?.name,
      })),
    });
  });

  return router;
}

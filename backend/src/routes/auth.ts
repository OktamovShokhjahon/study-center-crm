import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import { User } from "../models/User";
import { Center } from "../models/Center";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken } from "../utils/tokens";

export function createAuthRouter(opts: {
  jwtSecret: string;
  jwtExpiresIn: string;
}): Router {
  const router = Router();

  router.post(
    "/login",
    body("username").trim().notEmpty(),
    body("password").notEmpty(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const { username, password } = req.body as { username: string; password: string };
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const token = signAccessToken(
        {
          sub: user._id.toString(),
          role: user.role,
          centerId: user.centerId.toString(),
        },
        opts.jwtSecret,
        opts.jwtExpiresIn
      );
      res.json({
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          centerId: user.centerId,
          language: user.language,
          theme: user.theme,
        },
      });
    }
  );

  /** One-time setup for a single study center (only when database has zero users) */
  router.post(
    "/register",
    body("centerName").trim().notEmpty(),
    body("adminFullName").trim().notEmpty(),
    body("adminUsername").trim().notEmpty(),
    body("adminPassword").isLength({ min: 8 }),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const count = await User.countDocuments();
      if (count > 0) {
        res.status(403).json({ error: "Registration is closed. Use an admin account." });
        return;
      }
      const { centerName, adminFullName, adminUsername, adminPassword } = req.body as {
        centerName: string;
        adminFullName: string;
        adminUsername: string;
        adminPassword: string;
      };

      const center = await Center.create({
        name: centerName,
        subdomain: "main",
      });
      const passwordHash = await hashPassword(adminPassword);
      const admin = await User.create({
        fullName: adminFullName,
        username: adminUsername.toLowerCase().trim(),
        passwordHash,
        passwordPlain: adminPassword,
        role: "ADMIN",
        centerId: center._id,
      });
      const token = signAccessToken(
        {
          sub: admin._id.toString(),
          role: admin.role,
          centerId: admin.centerId.toString(),
        },
        opts.jwtSecret,
        opts.jwtExpiresIn
      );
      res.status(201).json({
        token,
        center: { id: center._id, name: center.name, subdomain: center.subdomain },
        user: {
          id: admin._id,
          fullName: admin.fullName,
          username: admin.username,
          role: admin.role,
        },
      });
    }
  );

  router.post(
    "/forgot-password",
    body("username").trim().notEmpty(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const { username } = req.body as { username: string };
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        res.json({ message: "If the account exists, reset instructions will be sent." });
        return;
      }
      const raw = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      user.passwordResetToken = tokenHash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const devPayload =
        process.env.NODE_ENV === "development"
          ? { resetToken: raw, expiresAt: user.passwordResetExpires }
          : {};
      res.json({
        message: "If the account exists, use the reset token before it expires.",
        ...devPayload,
      });
    }
  );

  router.post(
    "/reset-password",
    body("token").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const { token, newPassword } = req.body as { token: string; newPassword: string };
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const user = await User.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      }).select("+passwordResetToken +passwordResetExpires");
      if (!user) {
        res.status(400).json({ error: "Invalid or expired token" });
        return;
      }
      user.passwordHash = await hashPassword(newPassword);
      user.passwordPlain = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      res.json({ message: "Password updated" });
    }
  );

  return router;
}

import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";

export function createMeRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(authMiddleware(jwtSecret));

  router.patch(
    "/preferences",
    body("language").optional().isIn(["uz", "en", "ru"]),
    body("theme").optional().isIn(["light", "dark"]),
    async (req, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      if (!req.auth) return;
      const updates: { language?: string; theme?: string } = {};
      if (req.body.language) updates.language = req.body.language;
      if (req.body.theme) updates.theme = req.body.theme;
      const user = await User.findByIdAndUpdate(req.auth.sub, updates, { new: true });
      res.json({
        language: user?.language,
        theme: user?.theme,
      });
    }
  );

  return router;
}

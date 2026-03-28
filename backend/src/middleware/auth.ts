import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/tokens";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function authMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = header.slice(7);
    try {
      req.auth = verifyAccessToken(token, secret);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

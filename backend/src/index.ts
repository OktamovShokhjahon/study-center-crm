import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import { createAuthRouter } from "./routes/auth";
import { createMeRouter } from "./routes/me";
import { createUsersRouter } from "./routes/users";
import { createStudentsRouter } from "./routes/students";
import { createDashboardRouter } from "./routes/dashboard";
import { createCoursesRouter } from "./routes/courses";
import { createGroupsRouter } from "./routes/groups";
import { createPaymentsRouter } from "./routes/payments";
import { createTeacherRouter } from "./routes/teacher";
import { createStudentPortalRouter } from "./routes/studentPortal";
import { createParentPortalRouter } from "./routes/parentPortal";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/study_center_crm";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function main() {
  await connectDatabase(MONGODB_URI);

  const app = express();
  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "study-center-crm-api" });
  });

  app.use(
    "/api/auth",
    createAuthRouter({ jwtSecret: JWT_SECRET, jwtExpiresIn: JWT_EXPIRES_IN })
  );
  app.use("/api/me", createMeRouter(JWT_SECRET));
  app.use("/api/users", createUsersRouter(JWT_SECRET));
  app.use("/api/students", createStudentsRouter(JWT_SECRET));
  app.use("/api/dashboard", createDashboardRouter(JWT_SECRET));
  app.use("/api/courses", createCoursesRouter(JWT_SECRET));
  app.use("/api/groups", createGroupsRouter(JWT_SECRET));
  app.use("/api/payments", createPaymentsRouter(JWT_SECRET));
  app.use("/api/teacher", createTeacherRouter(JWT_SECRET));
  app.use("/api/student", createStudentPortalRouter(JWT_SECRET));
  app.use("/api/parent", createParentPortalRouter(JWT_SECRET));

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

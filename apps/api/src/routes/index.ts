import { Router } from "express";
import { authRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { tasksRouter } from "./tasks";
import { providersRouter } from "./providers";
import { adminRouter } from "./admin";
import { notificationsRouter } from "./notifications";

export const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/tasks", tasksRouter);
router.use("/providers", providersRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationsRouter);
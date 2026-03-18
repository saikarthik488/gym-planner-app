import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" }
  });

  res.json(notifications);
});

notificationsRouter.patch("/:notificationId/read", async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.notificationId },
    data: { isRead: true }
  });

  res.json(notification);
});
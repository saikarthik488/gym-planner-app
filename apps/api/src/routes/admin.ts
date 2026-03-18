import { ProviderStatus, Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { sanitizeUser } from "../utils/serializers";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get("/dashboard", async (_req, res) => {
  const [users, tasks, bids, providersPending, categories, notifications] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.bid.count(),
    prisma.providerProfile.count({ where: { verification: ProviderStatus.PENDING } }),
    prisma.category.count(),
    prisma.notification.count()
  ]);

  res.json({ users, tasks, bids, providersPending, categories, notifications });
});

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { providerProfile: { include: { categories: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(users.map((user) => sanitizeUser(user)));
});

adminRouter.patch("/providers/:userId", async (req, res) => {
  const { verification } = req.body as { verification: ProviderStatus };
  const provider = await prisma.providerProfile.update({
    where: { userId: req.params.userId },
    data: { verification },
    include: { user: true, categories: true }
  });

  await prisma.notification.create({
    data: {
      userId: req.params.userId,
      title: "Provider status updated",
      body: `Your provider account is now ${verification.toLowerCase()}.`
    }
  });

  res.json({ ...provider, user: sanitizeUser(provider.user) });
});

adminRouter.post("/categories", async (req, res) => {
  const { name, description } = req.body;
  const category = await prisma.category.create({ data: { name, description } });
  res.status(201).json(category);
});

adminRouter.get("/tasks", async (_req, res) => {
  const tasks = await prisma.task.findMany({
    include: {
      client: { select: { id: true, name: true } },
      category: true,
      bids: true,
      reviews: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(tasks);
});
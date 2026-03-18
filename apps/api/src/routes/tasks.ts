import { ProviderStatus, Role, TaskStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { rankProvidersForTask } from "../services/matching";

export const tasksRouter = Router();

tasksRouter.get("/", async (req, res) => {
  const { category, location, status, search } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      ...(category ? { category: { name: String(category) } } : {}),
      ...(location ? { location: { contains: String(location), mode: "insensitive" } } : {}),
      ...(status ? { status: String(status) as TaskStatus } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: String(search), mode: "insensitive" } },
              { description: { contains: String(search), mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      category: true,
      client: { select: { id: true, name: true } },
      bids: true,
      reviews: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(tasks);
});

tasksRouter.post("/", requireAuth, requireRole(Role.CLIENT), async (req, res) => {
  const { title, description, categoryId, location, budget, scheduledDate } = req.body;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      categoryId,
      location,
      budget: Number(budget),
      scheduledDate: new Date(scheduledDate),
      clientId: req.auth!.userId
    },
    include: { category: true }
  });

  const matchingProviders = await prisma.providerProfile.findMany({
    where: { verification: ProviderStatus.APPROVED },
    include: {
      categories: true,
      user: {
        select: {
          id: true,
          name: true,
          address: true
        }
      }
    }
  });

  const ranked = rankProvidersForTask(task, matchingProviders);
  if (ranked.length > 0) {
    await prisma.notification.createMany({
      data: ranked.map((provider) => ({
        userId: provider.providerId,
        title: "New matched task",
        body: `A new task matches your profile: ${task.title}`
      }))
    });
  }

  res.status(201).json({ task, suggestions: ranked });
});

tasksRouter.get("/my/client", requireAuth, requireRole(Role.CLIENT), async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { clientId: req.auth!.userId },
    include: {
      category: true,
      bids: {
        include: {
          provider: {
            include: { providerProfile: { include: { categories: true } } }
          }
        }
      },
      reviews: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(tasks);
});

tasksRouter.get("/my/provider", requireAuth, requireRole(Role.PROVIDER), async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        {
          bids: {
            some: {
              providerId: req.auth!.userId,
              status: "ACCEPTED"
            }
          }
        },
        {
          assignedProviderId: req.auth!.userId
        }
      ]
    },
    include: {
      category: true,
      client: { select: { id: true, name: true, phone: true, address: true } },
      bids: true
    },
    orderBy: { scheduledDate: "asc" }
  });

  res.json(tasks);
});

tasksRouter.post("/:taskId/bids", requireAuth, requireRole(Role.PROVIDER), async (req, res) => {
  const { amount, message } = req.body;
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const bid = await prisma.bid.create({
    data: {
      taskId: task.id,
      providerId: req.auth!.userId,
      amount: Number(amount),
      message
    }
  });

  await prisma.notification.create({
    data: {
      userId: task.clientId,
      title: "New bid received",
      body: `A provider placed a bid on ${task.title}.`
    }
  });

  res.status(201).json(bid);
});

tasksRouter.patch("/:taskId/bids/:bidId", requireAuth, requireRole(Role.CLIENT), async (req, res) => {
  const { status } = req.body as { status: "ACCEPTED" | "REJECTED" };
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task || task.clientId !== req.auth!.userId) {
    return res.status(404).json({ message: "Task not found" });
  }

  const existingBid = await prisma.bid.findUnique({ where: { id: req.params.bidId } });
  if (!existingBid || existingBid.taskId !== task.id) {
    return res.status(404).json({ message: "Bid not found" });
  }

  const bid = await prisma.bid.update({
    where: { id: req.params.bidId },
    data: { status },
    include: { provider: true }
  });

  if (status === "ACCEPTED") {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        assignedProviderId: bid.providerId
      }
    });

    await prisma.bid.updateMany({
      where: {
        taskId: task.id,
        id: { not: bid.id }
      },
      data: { status: "REJECTED" }
    });
  }

  await prisma.notification.create({
    data: {
      userId: bid.providerId,
      title: `Bid ${status.toLowerCase()}`,
      body: `Your bid for ${task.title} was ${status.toLowerCase()}.`
    }
  });

  res.json(bid);
});

tasksRouter.patch("/:taskId/status", requireAuth, async (req, res) => {
  const { status } = req.body as { status: TaskStatus };
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const canUpdate =
    (req.auth!.role === Role.CLIENT && task.clientId === req.auth!.userId) ||
    (req.auth!.role === Role.PROVIDER && task.assignedProviderId === req.auth!.userId);

  if (!canUpdate) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { status }
  });

  if (task.clientId !== req.auth!.userId) {
    await prisma.notification.create({
      data: {
        userId: task.clientId,
        title: "Task status updated",
        body: `${task.title} is now ${status.replace("_", " ").toLowerCase()}.`
      }
    });
  }

  res.json(updatedTask);
});

tasksRouter.post("/:taskId/reviews", requireAuth, requireRole(Role.CLIENT), async (req, res) => {
  const { rating, comment, providerId } = req.body;
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task || task.clientId !== req.auth!.userId || task.status !== TaskStatus.COMPLETED) {
    return res.status(400).json({ message: "Review cannot be created for this task" });
  }

  if (task.assignedProviderId !== providerId) {
    return res.status(400).json({ message: "Review must target the assigned provider" });
  }

  const review = await prisma.review.create({
    data: {
      taskId: task.id,
      clientId: req.auth!.userId,
      providerId,
      rating: Number(rating),
      comment
    }
  });

  const stats = await prisma.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.providerProfile.update({
    where: { userId: providerId },
    data: {
      ratingAverage: stats._avg.rating ?? 0,
      jobsCompleted: stats._count.rating
    }
  });

  res.status(201).json(review);
});

tasksRouter.get("/:taskId/matches", requireAuth, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { category: true }
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const providers = await prisma.providerProfile.findMany({
    where: { verification: ProviderStatus.APPROVED },
    include: {
      categories: true,
      user: {
        select: {
          id: true,
          name: true,
          address: true
        }
      }
    }
  });

  res.json(rankProvidersForTask(task, providers));
});
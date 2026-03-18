import { ProviderStatus, Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const providersRouter = Router();

providersRouter.get("/", async (_req, res) => {
  const providers = await prisma.providerProfile.findMany({
    where: { verification: ProviderStatus.APPROVED },
    include: {
      categories: true,
      user: {
        select: {
          id: true,
          name: true,
          address: true,
          profilePhoto: true
        }
      }
    },
    orderBy: [{ ratingAverage: "desc" }, { jobsCompleted: "desc" }]
  });

  res.json(providers);
});

providersRouter.get("/me", requireAuth, requireRole(Role.PROVIDER), async (req, res) => {
  const provider = await prisma.providerProfile.findUnique({
    where: { userId: req.auth!.userId },
    include: {
      categories: true,
      user: true
    }
  });

  res.json(provider);
});

providersRouter.patch("/me", requireAuth, requireRole(Role.PROVIDER), async (req, res) => {
  const { bio, skills, serviceAreas, hourlyRate, isAvailable, categoryIds } = req.body;

  const provider = await prisma.providerProfile.update({
    where: { userId: req.auth!.userId },
    data: {
      bio,
      skills,
      serviceAreas,
      hourlyRate: hourlyRate ? Number(hourlyRate) : null,
      isAvailable,
      categories: categoryIds
        ? {
            set: [],
            connect: categoryIds.map((id: string) => ({ id }))
          }
        : undefined
    },
    include: { categories: true, user: true }
  });

  res.json(provider);
});
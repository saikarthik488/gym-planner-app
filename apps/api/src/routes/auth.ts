import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { comparePassword, hashPassword } from "../utils/hash";
import { sanitizeUser } from "../utils/serializers";
import { signToken } from "../utils/jwt";

export const authRouter = Router();

const authUserInclude = {
  providerProfile: {
    include: { categories: true }
  }
} as const;

authRouter.post("/register", async (req, res) => {
  const { email, password, role, name, phone, address, profilePhoto, providerProfile } = req.body;

  if (!email || !password || !role || !name || !Object.values(Role).includes(role)) {
    return res.status(400).json({ message: "Missing required registration fields" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role,
      name,
      phone,
      address,
      profilePhoto,
      providerProfile: role === Role.PROVIDER
        ? {
            create: {
              bio: providerProfile?.bio,
              skills: providerProfile?.skills ?? [],
              serviceAreas: providerProfile?.serviceAreas ?? [],
              hourlyRate: providerProfile?.hourlyRate,
              categories: providerProfile?.categoryIds?.length
                ? { connect: providerProfile.categoryIds.map((id: string) => ({ id })) }
                : undefined
            }
          }
        : undefined
    },
    include: authUserInclude
  });

  const token = signToken({ userId: user.id, role: user.role });

  return res.status(201).json({
    token,
    user: sanitizeUser(user)
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: authUserInclude
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, role: user.role });
  return res.json({ token, user: sanitizeUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: authUserInclude
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(sanitizeUser(user));
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const { name, phone, address, profilePhoto } = req.body;
  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { name, phone, address, profilePhoto },
    include: authUserInclude
  });

  res.json(sanitizeUser(user));
});
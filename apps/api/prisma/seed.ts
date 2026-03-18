import { PrismaClient, ProviderStatus, Role, TaskStatus } from "@prisma/client";
import { hashPassword } from "../src/utils/hash";

const prisma = new PrismaClient();

async function main() {
  const categoryNames = [
    ["Cleaning", "Home, office, and deep cleaning services"],
    ["Home Chef", "Meal prep, private dining, and weekly cooking"],
    ["Healthcare Assistance", "Elder care, companionship, and light medical support"],
    ["Grooming", "Hair, beauty, and personal care services"],
    ["Daycare", "Child care and after-school support"],
    ["Handyman", "Repairs, installations, and maintenance"]
  ] as const;

  for (const [name, description] of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { description },
      create: { name, description }
    });
  }

  const adminPassword = await hashPassword("admin1234");
  await prisma.user.upsert({
    where: { email: "admin@taskswift.dev" },
    update: {},
    create: {
      email: "admin@taskswift.dev",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      name: "Platform Admin"
    }
  });

  const cleaning = await prisma.category.findUniqueOrThrow({ where: { name: "Cleaning" } });
  const handyman = await prisma.category.findUniqueOrThrow({ where: { name: "Handyman" } });

  const clientPassword = await hashPassword("client1234");
  const providerPassword = await hashPassword("provider1234");

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      passwordHash: clientPassword,
      role: Role.CLIENT,
      name: "Ava Client",
      phone: "+61 400 000 001",
      address: "Sydney CBD"
    }
  });

  const provider = await prisma.user.upsert({
    where: { email: "provider@example.com" },
    update: {},
    create: {
      email: "provider@example.com",
      passwordHash: providerPassword,
      role: Role.PROVIDER,
      name: "Leo Provider",
      phone: "+61 400 000 002",
      address: "Inner West",
      providerProfile: {
        create: {
          bio: "Experienced cleaner and handyman available evenings and weekends.",
          skills: ["deep cleaning", "repairs", "assembly"],
          serviceAreas: ["Sydney CBD", "Inner West", "Parramatta"],
          hourlyRate: 45,
          verification: ProviderStatus.APPROVED,
          categories: {
            connect: [{ id: cleaning.id }, { id: handyman.id }]
          }
        }
      }
    },
    include: { providerProfile: true }
  });

  const existingTask = await prisma.task.findFirst({ where: { title: "Deep clean for 2-bedroom apartment" } });
  if (!existingTask) {
    const task = await prisma.task.create({
      data: {
        clientId: client.id,
        categoryId: cleaning.id,
        title: "Deep clean for 2-bedroom apartment",
        description: "Need a full apartment clean before guests arrive, including bathroom and kitchen.",
        location: "Sydney CBD",
        budget: 180,
        scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        status: TaskStatus.POSTED
      }
    });

    await prisma.bid.create({
      data: {
        taskId: task.id,
        providerId: provider.id,
        amount: 170,
        message: "I can handle the clean with supplies included."
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
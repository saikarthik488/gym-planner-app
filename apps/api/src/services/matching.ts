import { ProviderProfile, Task } from "@prisma/client";

type RankedProviderInput = ProviderProfile & {
  categories: Array<{ name: string }>;
  user: {
    id: string;
    name: string;
    address: string | null;
  };
};

function scoreLocation(taskLocation: string, serviceAreas: string[]) {
  return serviceAreas.some((area) => area.toLowerCase().includes(taskLocation.toLowerCase())) ? 30 : 10;
}

function scoreSkills(task: Task & { category: { name: string } }, skills: string[], categories: string[]) {
  const categoryScore = categories.includes(task.category.name) ? 25 : 0;
  const termMatches = [task.title, task.description, task.category.name]
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .reduce((score, term) => score + (skills.some((skill) => skill.toLowerCase().includes(term)) ? 3 : 0), 0);

  return Math.min(35, categoryScore + termMatches);
}

export function rankProvidersForTask(task: Task & { category: { name: string } }, providers: RankedProviderInput[]) {
  return providers
    .map((provider) => {
      const categories = provider.categories.map((category) => category.name);
      const score =
        scoreLocation(task.location, provider.serviceAreas) +
        scoreSkills(task, provider.skills, categories) +
        Math.min(20, provider.ratingAverage * 4) +
        (provider.isAvailable ? 15 : 0);

      return {
        providerId: provider.userId,
        providerName: provider.user.name,
        score,
        ratingAverage: provider.ratingAverage,
        jobsCompleted: provider.jobsCompleted,
        serviceAreas: provider.serviceAreas,
        skills: provider.skills
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
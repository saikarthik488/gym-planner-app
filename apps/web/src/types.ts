export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type TaskStatus = "POSTED" | "IN_PROGRESS" | "COMPLETED";
export type ProviderStatus = "PENDING" | "APPROVED" | "SUSPENDED";

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type ProviderProfile = {
  id: string;
  userId: string;
  bio?: string;
  skills: string[];
  serviceAreas: string[];
  hourlyRate?: number;
  ratingAverage: number;
  jobsCompleted: number;
  isAvailable: boolean;
  verification: ProviderStatus;
  categories: Category[];
};

export type User = {
  id: string;
  email: string;
  role: Role;
  name: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  providerProfile?: ProviderProfile;
};

export type Bid = {
  id: string;
  amount: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  providerId: string;
  provider?: User;
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  providerId: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  scheduledDate: string;
  status: TaskStatus;
  assignedProviderId?: string;
  category: Category;
  client?: Pick<User, "id" | "name">;
  bids: Bid[];
  reviews: Review[];
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};
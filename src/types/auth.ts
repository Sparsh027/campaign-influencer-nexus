
export type UserRole = "admin" | "influencer";

export interface AdminUser {
  id: string; // This is the Supabase ID
  dbId: string; // This is the database ID from the admins table
  email: string;
  name: string;
  role: "admin";
}

export interface InfluencerUser {
  id: string; // This is the Supabase ID
  dbId: string; // This is the database ID from the influencers table
  email: string;
  name: string;
  role: "influencer";
  instagram?: string;
  followerCount?: number;
  phone?: string;
  categories?: string[];
  city?: string;
  profileCompleted: boolean;
}

export type User = AdminUser | InfluencerUser;

// Type guards to check user types
export function isAdminUser(user: User): user is AdminUser {
  return user.role === "admin";
}

export function isInfluencerUser(user: User): user is InfluencerUser {
  return user.role === "influencer";
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<InfluencerUser>) => Promise<void>;
}

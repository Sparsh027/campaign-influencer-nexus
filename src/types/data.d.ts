
import { InfluencerUser } from "./auth";

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  budget: number;
  description: string;
  requirements: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  categories: string[];
  targetLocations: string[];
  minFollowers: number;
  maxInfluencers: number;
  paymentPerPost: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: 'admin' | 'influencer';
  receiverId: string;
  receiverType: 'admin' | 'influencer';
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  influencer?: {
    id: string;
    name: string;
    instagram: string;
    followerCount: number;
    city: string;
    categories: string[];
    email: string;
  };
  campaign?: Campaign;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  userType: 'admin' | 'influencer';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DataContextType {
  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getApplicationsForCampaign: (campaignId: string) => Application[];
  getApprovedInfluencersForCampaign: (campaignId: string) => Application[];
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected') => Promise<void>;
  createMessage: (messageData: { receiverId: string, receiverType: 'admin' | 'influencer', content: string }) => Promise<void>;
  influencers: InfluencerUser[];
  blockInfluencer: (id: string) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  applications: Application[];
  applyToCampaign: (campaignId: string) => Promise<void>;
  messages: Message[];
  conversations: { id: string; name: string; unread: number }[];
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  getEligibleCampaigns: () => Campaign[];
  isInfluencerEligible: (campaignId: string, influencerId?: string) => boolean;
  hasApplied: (campaignId: string) => boolean;
  getEligibleInfluencers: (campaignId: string) => InfluencerUser[];
}

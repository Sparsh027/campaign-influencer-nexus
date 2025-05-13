import { InfluencerUser } from "./auth";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  minFollowers: number;
  categories: string[];
  city: string;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
}

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  campaign?: Campaign;
  influencer?: InfluencerUser;
}

// DataContextType update
export interface DataContextType {
  campaigns: Campaign[];
  createCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getEligibleInfluencers: (campaignId: string) => InfluencerUser[];
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
}

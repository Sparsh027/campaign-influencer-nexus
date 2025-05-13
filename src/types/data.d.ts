
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
}

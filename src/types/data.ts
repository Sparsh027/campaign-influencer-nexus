
import { User } from './auth';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  minFollowers: number;
  categories: string[];
  city: string;
  createdAt: string;
  status: 'active' | 'completed' | 'draft';
}

export interface CampaignPhase {
  id: string;
  campaignId: string;
  phaseNumber: number;
  budgetAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface InfluencerVisibility {
  id: string;
  influencerId: string;
  campaignId: string;
  assignedPhase: number | null;
  negotiationVisible: boolean;
  customOfferAmount: number | null;
}

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  campaign?: Campaign;
  influencer?: User;
  budgetAppliedFor?: number;
  isNegotiated?: boolean;
  finalOfferAmount?: number;
}

export interface Message {
  id: string;
  senderType: 'admin' | 'influencer';
  senderId: string;
  receiverType: 'admin' | 'influencer';
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Notification {
  id: string;
  type: 'new_influencer' | 'new_application' | 'new_message' | 'application_approved' | 'application_rejected';
  message: string;
  targetType: 'admin' | 'influencer';
  targetId: string;
  userId: string;
  read: boolean;
  createdAt: string;
}

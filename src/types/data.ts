
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

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  campaign?: Campaign;
  influencer?: User;
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
  type: 'new_influencer' | 'new_application' | 'new_message';
  message: string;
  targetType: 'admin' | 'influencer';
  targetId: string;
  read: boolean;
  createdAt: string;
}

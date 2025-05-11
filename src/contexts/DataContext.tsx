
import React, { createContext, useContext, useState, useEffect } from "react";
import { Campaign, Application, Message, Notification } from "../types/data";
import { User } from "../types/auth";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface DataContextType {
  // Campaigns
  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, "id" | "createdAt">) => Promise<void>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Influencers
  influencers: User[];
  blockInfluencer: (id: string) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  
  // Applications
  applications: Application[];
  applyToCampaign: (campaignId: string) => Promise<void>;
  
  // Messages
  messages: Message[];
  conversations: { id: string; name: string; unread: number }[];
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  
  // Filtering
  getEligibleCampaigns: () => Campaign[];
  getEligibleInfluencers: (campaignId: string) => User[];
  isInfluencerEligible: (campaignId: string, influencerId?: string) => boolean;
  hasApplied: (campaignId: string) => boolean;
}

// Sample data
const SAMPLE_CATEGORIES = [
  "Fashion", "Beauty", "Travel", "Fitness", "Food", "Lifestyle", "Technology", 
  "Gaming", "Health", "Parenting", "Business", "Education", "Entertainment"
];

const SAMPLE_CITIES = [
  "New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Austin", "London",
  "Paris", "Tokyo", "Sydney", "Berlin", "Toronto", "Dubai", "Singapore"
];

// Generate sample influencers
const generateInfluencers = (count: number): User[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `influencer-${i + 1}`,
    email: `influencer${i + 1}@example.com`,
    name: `Influencer ${i + 1}`,
    role: "influencer",
    instagram: `@influencer${i + 1}`,
    followerCount: Math.floor(Math.random() * 900000) + 100000,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    categories: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => 
      SAMPLE_CATEGORIES[Math.floor(Math.random() * SAMPLE_CATEGORIES.length)]
    ),
    city: SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)],
    profileCompleted: true
  }));
};

// Generate sample campaigns
const generateCampaigns = (count: number): Campaign[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `campaign-${i + 1}`,
    title: `Campaign ${i + 1}`,
    description: `This is a sample campaign description for campaign ${i + 1}. It includes details about the campaign objectives, deliverables, and timeline.`,
    minFollowers: Math.floor(Math.random() * 50000) + 10000,
    categories: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => 
      SAMPLE_CATEGORIES[Math.floor(Math.random() * SAMPLE_CATEGORIES.length)]
    ),
    city: SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    status: Math.random() > 0.2 ? 'active' : 'completed'
  }));
};

// Initial sample data
const SAMPLE_INFLUENCERS = generateInfluencers(15);
const SAMPLE_CAMPAIGNS = generateCampaigns(8);
const SAMPLE_APPLICATIONS: Application[] = [];
const SAMPLE_MESSAGES: Message[] = [];
const SAMPLE_NOTIFICATIONS: Notification[] = [];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [influencers, setInfluencers] = useState<User[]>(SAMPLE_INFLUENCERS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(SAMPLE_CAMPAIGNS);
  const [applications, setApplications] = useState<Application[]>(SAMPLE_APPLICATIONS);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);

  // Get conversations for the current user
  const conversations = React.useMemo(() => {
    if (!user) return [];

    // Get unique conversation partners
    const conversationPartners = new Map<string, { name: string; unread: number }>();
    
    messages.forEach(msg => {
      if (msg.senderId === user.id) {
        // Outgoing message
        if (!conversationPartners.has(msg.receiverId)) {
          const partner = [...influencers, { id: "admin-1", name: "Admin", role: "admin" } as User].find(u => u.id === msg.receiverId);
          if (partner) {
            conversationPartners.set(msg.receiverId, { 
              name: partner.name,
              unread: 0 
            });
          }
        }
      } else if (msg.receiverId === user.id) {
        // Incoming message
        if (!conversationPartners.has(msg.senderId)) {
          const partner = [...influencers, { id: "admin-1", name: "Admin", role: "admin" } as User].find(u => u.id === msg.senderId);
          if (partner) {
            conversationPartners.set(msg.senderId, { 
              name: partner.name,
              unread: msg.read ? 0 : 1 
            });
          }
        } else if (!msg.read) {
          const current = conversationPartners.get(msg.senderId);
          if (current) {
            conversationPartners.set(msg.senderId, {
              ...current,
              unread: current.unread + 1
            });
          }
        }
      }
    });
    
    return Array.from(conversationPartners.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      unread: data.unread
    }));
  }, [user, messages, influencers]);

  // Create a new campaign
  const createCampaign = async (campaignData: Omit<Campaign, "id" | "createdAt">) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setCampaigns(prev => [...prev, newCampaign]);
    
    // Create notification for all influencers
    const newNotifications = influencers.map(influencer => ({
      id: `notification-${Date.now()}-${influencer.id}`,
      type: 'new_application' as const,
      message: `New campaign available: ${newCampaign.title}`,
      userId: influencer.id,
      read: false,
      createdAt: new Date().toISOString()
    }));
    
    setNotifications(prev => [...prev, ...newNotifications]);
    
    toast.success("Campaign created successfully");
  };
  
  // Update a campaign
  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === id ? { ...campaign, ...data } : campaign
    ));
    toast.success("Campaign updated successfully");
  };
  
  // Delete a campaign
  const deleteCampaign = async (id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    // Remove related applications
    setApplications(prev => prev.filter(app => app.campaignId !== id));
    toast.success("Campaign deleted successfully");
  };
  
  // Block an influencer
  const blockInfluencer = async (id: string) => {
    setInfluencers(prev => prev.map(influencer => 
      influencer.id === id ? { ...influencer, blocked: true } : influencer
    ));
    toast.success("Influencer blocked successfully");
  };
  
  // Delete an influencer
  const deleteInfluencer = async (id: string) => {
    setInfluencers(prev => prev.filter(influencer => influencer.id !== id));
    // Remove related applications
    setApplications(prev => prev.filter(app => app.influencerId !== id));
    toast.success("Influencer removed successfully");
  };
  
  // Apply to a campaign
  const applyToCampaign = async (campaignId: string) => {
    if (!user || user.role !== "influencer") {
      throw new Error("Only influencers can apply to campaigns");
    }
    
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Check if already applied
    const existingApplication = applications.find(
      app => app.campaignId === campaignId && app.influencerId === user.id
    );
    
    if (existingApplication) {
      throw new Error("You have already applied to this campaign");
    }
    
    // Check eligibility
    if (!isInfluencerEligible(campaignId)) {
      throw new Error("You don't meet the eligibility criteria for this campaign");
    }
    
    const newApplication: Application = {
      id: `application-${Date.now()}`,
      campaignId,
      influencerId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setApplications(prev => [...prev, newApplication]);
    
    // Create notification for admin
    const newNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'new_application',
      message: `${user.name} applied to ${campaign.title}`,
      userId: "admin-1", // Admin ID
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    toast.success("Application submitted successfully");
  };
  
  // Send a message
  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) {
      throw new Error("You must be logged in to send messages");
    }
    
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      senderId: user.id,
      receiverId,
      content,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Create notification for receiver
    const newNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'new_message',
      message: `New message from ${user.name}`,
      userId: receiverId,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };
  
  // Mark notification as read
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Get eligible campaigns for current influencer
  const getEligibleCampaigns = () => {
    if (!user || user.role !== "influencer") {
      return [];
    }
    
    return campaigns.filter(campaign => {
      // Only show active campaigns
      if (campaign.status !== 'active') return false;
      
      // Check eligibility
      return (user.followerCount || 0) >= campaign.minFollowers &&
             (!campaign.categories.length || campaign.categories.some(cat => 
                user.categories?.includes(cat)
             )) &&
             (!campaign.city || user.city === campaign.city);
    });
  };
  
  // Get eligible influencers for a specific campaign
  const getEligibleInfluencers = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return [];
    
    return influencers.filter(influencer => 
      (influencer.followerCount || 0) >= campaign.minFollowers &&
      (!campaign.categories.length || campaign.categories.some(cat => 
        influencer.categories?.includes(cat)
      )) &&
      (!campaign.city || influencer.city === campaign.city)
    );
  };
  
  // Check if an influencer is eligible for a campaign
  const isInfluencerEligible = (campaignId: string, influencerId?: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return false;
    
    const influencer = influencerId 
      ? influencers.find(i => i.id === influencerId)
      : user?.role === "influencer" ? user : null;
      
    if (!influencer) return false;
    
    return (influencer.followerCount || 0) >= campaign.minFollowers &&
           (!campaign.categories.length || campaign.categories.some(cat => 
             influencer.categories?.includes(cat)
           )) &&
           (!campaign.city || influencer.city === campaign.city);
  };
  
  // Check if current user has applied to a campaign
  const hasApplied = (campaignId: string) => {
    if (!user) return false;
    
    return applications.some(
      app => app.campaignId === campaignId && app.influencerId === user.id
    );
  };
  
  return (
    <DataContext.Provider value={{
      // Data
      campaigns,
      influencers,
      applications,
      messages,
      notifications,
      conversations,
      
      // Campaign actions
      createCampaign,
      updateCampaign,
      deleteCampaign,
      
      // Influencer actions
      blockInfluencer,
      deleteInfluencer,
      
      // Application actions
      applyToCampaign,
      
      // Message actions
      sendMessage,
      
      // Notification actions
      markNotificationAsRead,
      
      // Filter helpers
      getEligibleCampaigns,
      getEligibleInfluencers,
      isInfluencerEligible,
      hasApplied,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

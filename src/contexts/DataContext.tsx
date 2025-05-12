
import React, { createContext, useContext, useState, useEffect } from "react";
import { Campaign, Application, Message, Notification } from "../types/data";
import { User, InfluencerUser } from "../types/auth";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DataContextType {
  // Campaigns
  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, "id" | "createdAt">) => Promise<void>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Influencers
  influencers: InfluencerUser[];
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
  getEligibleInfluencers: (campaignId: string) => InfluencerUser[];
  isInfluencerEligible: (campaignId: string, influencerId?: string) => boolean;
  hasApplied: (campaignId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [influencers, setInfluencers] = useState<InfluencerUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchInfluencers();
      fetchApplications();
      fetchMessages();
      fetchNotifications();
    }
  }, [user]);

  // Fetch campaigns from the database
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        const formattedCampaigns: Campaign[] = data.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          minFollowers: c.min_followers,
          categories: c.categories || [],
          city: c.city || '',
          createdAt: c.created_at,
          status: c.status
        }));
        
        setCampaigns(formattedCampaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  // Fetch influencers from the database
  const fetchInfluencers = async () => {
    try {
      // Only fetch if user is admin
      if (user?.role !== 'admin') {
        return;
      }
      
      const { data, error } = await supabase
        .from('influencers')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        const formattedInfluencers: InfluencerUser[] = data.map(i => ({
          id: i.auth_id,
          dbId: i.id,
          email: i.email,
          name: i.name,
          role: "influencer",
          instagram: i.instagram || undefined,
          followerCount: i.follower_count || undefined,
          phone: i.phone || undefined,
          categories: i.categories || undefined,
          city: i.city || undefined,
          profileCompleted: i.profile_completed
        }));
        
        setInfluencers(formattedInfluencers);
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };

  // Fetch applications from the database
  const fetchApplications = async () => {
    try {
      let query = supabase.from('applications').select(`
        *,
        campaigns(*)
      `);
      
      // Filter by user role
      if (user?.role === 'influencer') {
        query = query.eq('influencer_id', user.dbId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedApplications: Application[] = data.map(a => {
          const campaign = a.campaigns ? {
            id: a.campaigns.id,
            title: a.campaigns.title,
            description: a.campaigns.description,
            minFollowers: a.campaigns.min_followers,
            categories: a.campaigns.categories || [],
            city: a.campaigns.city || '',
            createdAt: a.campaigns.created_at,
            status: a.campaigns.status
          } : undefined;
          
          return {
            id: a.id,
            campaignId: a.campaign_id,
            influencerId: a.influencer_id,
            status: a.status,
            createdAt: a.created_at,
            campaign
          };
        });
        
        setApplications(formattedApplications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // Fetch messages from the database
  const fetchMessages = async () => {
    try {
      if (!user) return;
      
      let query = supabase.from('messages').select('*');
      
      // Filter by user role
      if (user.role === 'admin') {
        query = query.or(`sender_type.eq.admin,receiver_type.eq.admin`);
      } else {
        query = query.or(`and(sender_type.eq.influencer,sender_id.eq.${user.dbId}),and(receiver_type.eq.influencer,receiver_id.eq.${user.dbId})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedMessages: Message[] = data.map(m => ({
          id: m.id,
          senderType: m.sender_type,
          senderId: m.sender_id,
          receiverType: m.receiver_type,
          receiverId: m.receiver_id,
          content: m.content,
          read: m.read,
          createdAt: m.created_at
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch notifications from the database
  const fetchNotifications = async () => {
    try {
      if (!user) return;
      
      let query = supabase.from('notifications').select('*');
      
      // Filter by user role
      if (user.role === 'admin') {
        query = query.eq('target_type', 'admin');
      } else {
        query = query.eq('target_id', user.dbId).eq('target_type', 'influencer');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedNotifications: Notification[] = data.map(n => ({
          id: n.id,
          type: n.type as any,
          message: n.message,
          targetType: n.target_type,
          targetId: n.target_id,
          read: n.read,
          createdAt: n.created_at
        }));
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Get conversations for the current user
  const conversations = React.useMemo(() => {
    if (!user) return [];

    // Get unique conversation partners
    const conversationPartners = new Map<string, { name: string; unread: number }>();
    
    messages.forEach(msg => {
      if (msg.senderType === user.role && msg.senderId === user.dbId) {
        // Outgoing message
        const partnerId = msg.receiverId;
        const partnerType = msg.receiverType;
        
        if (!conversationPartners.has(partnerId)) {
          // Find partner name
          let partnerName = "Unknown";
          
          if (partnerType === "influencer") {
            const influencer = influencers.find(i => i.dbId === partnerId);
            if (influencer) {
              partnerName = influencer.name;
            }
          } else {
            partnerName = "Admin"; // For now, we only have one admin
          }
          
          conversationPartners.set(partnerId, { 
            name: partnerName,
            unread: 0 
          });
        }
      } else if (msg.receiverType === user.role && msg.receiverId === user.dbId) {
        // Incoming message
        const partnerId = msg.senderId;
        const partnerType = msg.senderType;
        
        if (!conversationPartners.has(partnerId)) {
          // Find partner name
          let partnerName = "Unknown";
          
          if (partnerType === "influencer") {
            const influencer = influencers.find(i => i.dbId === partnerId);
            if (influencer) {
              partnerName = influencer.name;
            }
          } else {
            partnerName = "Admin"; // For now, we only have one admin
          }
          
          conversationPartners.set(partnerId, { 
            name: partnerName,
            unread: msg.read ? 0 : 1
          });
        } else if (!msg.read) {
          const current = conversationPartners.get(partnerId);
          if (current) {
            conversationPartners.set(partnerId, {
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
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can create campaigns");
    }
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaignData.title,
          description: campaignData.description,
          min_followers: campaignData.minFollowers,
          categories: campaignData.categories,
          city: campaignData.city,
          status: campaignData.status
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newCampaign: Campaign = {
          id: data.id,
          title: data.title,
          description: data.description,
          minFollowers: data.min_followers,
          categories: data.categories || [],
          city: data.city || '',
          createdAt: data.created_at,
          status: data.status
        };
        
        setCampaigns(prev => [...prev, newCampaign]);
        
        // TODO: Create notifications for eligible influencers
        
        toast.success("Campaign created successfully");
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error("Failed to create campaign");
      throw error;
    }
  };
  
  // Update a campaign
  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update campaigns");
    }
    
    try {
      const updateData = {
        title: data.title,
        description: data.description,
        min_followers: data.minFollowers,
        categories: data.categories,
        city: data.city,
        status: data.status
      };
      
      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, ...data } : campaign
      ));
      
      toast.success("Campaign updated successfully");
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error("Failed to update campaign");
      throw error;
    }
  };
  
  // Delete a campaign
  const deleteCampaign = async (id: string) => {
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete campaigns");
    }
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      // Applications are automatically deleted due to ON DELETE CASCADE
      setApplications(prev => prev.filter(app => app.campaignId !== id));
      
      toast.success("Campaign deleted successfully");
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error("Failed to delete campaign");
      throw error;
    }
  };
  
  // Block an influencer
  const blockInfluencer = async (id: string) => {
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can block influencers");
    }
    
    toast.success("Influencer blocked successfully");
    // TODO: Implement blocking functionality when we have a blocked flag in the database
  };
  
  // Delete an influencer
  const deleteInfluencer = async (id: string) => {
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete influencers");
    }
    
    try {
      const influencer = influencers.find(i => i.dbId === id);
      if (!influencer) throw new Error("Influencer not found");
      
      // Delete the supabase auth user
      // Note: This will cascade delete the influencer record due to our database structure
      const { error } = await supabase.auth.admin.deleteUser(influencer.id);
      
      if (error) throw error;
      
      setInfluencers(prev => prev.filter(i => i.dbId !== id));
      setApplications(prev => prev.filter(app => app.influencerId !== id));
      
      toast.success("Influencer removed successfully");
    } catch (error) {
      console.error('Error deleting influencer:', error);
      toast.error("Failed to delete influencer");
      throw error;
    }
  };
  
  // Apply to a campaign
  const applyToCampaign = async (campaignId: string) => {
    if (!user || user.role !== "influencer") {
      throw new Error("Only influencers can apply to campaigns");
    }
    
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      
      // Check if already applied
      const existingApplication = applications.find(
        app => app.campaignId === campaignId && app.influencerId === user.dbId
      );
      
      if (existingApplication) {
        throw new Error("You have already applied to this campaign");
      }
      
      // Check eligibility
      if (!isInfluencerEligible(campaignId)) {
        throw new Error("You don't meet the eligibility criteria for this campaign");
      }
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          campaign_id: campaignId,
          influencer_id: user.dbId,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newApplication: Application = {
          id: data.id,
          campaignId: data.campaign_id,
          influencerId: data.influencer_id,
          status: data.status,
          createdAt: data.created_at,
          campaign
        };
        
        setApplications(prev => [...prev, newApplication]);
        
        // Create notification for admin
        // Find admin ID
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .single();
          
        if (!adminError && adminData) {
          await supabase
            .from('notifications')
            .insert({
              type: 'new_application',
              message: `${user.name} applied to ${campaign.title}`,
              target_type: 'admin',
              target_id: adminData.id,
              read: false
            });
        }
        
        toast.success("Application submitted successfully");
      }
    } catch (error: any) {
      console.error('Error applying to campaign:', error);
      toast.error(error?.message || "Failed to apply to campaign");
      throw error;
    }
  };
  
  // Send a message
  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) {
      throw new Error("You must be logged in to send messages");
    }
    
    try {
      // Determine receiver type (admin or influencer)
      // For this demo, we'll assume the receiver is an admin if current user is influencer, and vice versa
      const receiverType = user.role === 'admin' ? 'influencer' : 'admin';
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_type: user.role,
          sender_id: user.dbId,
          receiver_type: receiverType,
          receiver_id: receiverId,
          content,
          read: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newMessage: Message = {
          id: data.id,
          senderType: data.sender_type,
          senderId: data.sender_id,
          receiverType: data.receiver_type,
          receiverId: data.receiver_id,
          content: data.content,
          read: data.read,
          createdAt: data.created_at
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Create notification for receiver
        await supabase
          .from('notifications')
          .insert({
            type: 'new_message',
            message: `New message from ${user.name}`,
            target_type: receiverType,
            target_id: receiverId,
            read: false
          });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      throw error;
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Get eligible campaigns for current influencer
  const getEligibleCampaigns = () => {
    if (!user || user.role !== "influencer") {
      return [];
    }
    
    const influencerUser = user as InfluencerUser;
    
    return campaigns.filter(campaign => {
      // Only show active campaigns
      if (campaign.status !== 'active') return false;
      
      // Check eligibility
      return (influencerUser.followerCount || 0) >= campaign.minFollowers &&
             (!campaign.categories.length || campaign.categories.some(cat => 
                influencerUser.categories?.includes(cat)
             )) &&
             (!campaign.city || influencerUser.city === campaign.city);
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
    
    let influencerUser: InfluencerUser | null = null;
    
    if (influencerId) {
      const foundInfluencer = influencers.find(i => i.dbId === influencerId);
      if (!foundInfluencer) return false;
      influencerUser = foundInfluencer;
    } else if (user?.role === "influencer") {
      influencerUser = user as InfluencerUser;
    }
      
    if (!influencerUser) return false;
    
    return (influencerUser.followerCount || 0) >= campaign.minFollowers &&
           (!campaign.categories.length || campaign.categories.some(cat => 
             influencerUser?.categories?.includes(cat)
           )) &&
           (!campaign.city || influencerUser.city === campaign.city);
  };
  
  // Check if current user has applied to a campaign
  const hasApplied = (campaignId: string) => {
    if (!user) return false;
    
    return applications.some(
      app => app.campaignId === campaignId && app.influencerId === user.dbId
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

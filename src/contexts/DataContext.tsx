
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Campaign, Application, Message, Notification, Conversation, CampaignPhase, InfluencerVisibility } from '@/types/data';
import { InfluencerUser, User } from '@/types/auth';

// Define the shape of our context
export interface DataContextType {
  campaigns: Campaign[];
  applications: Application[];
  influencers: InfluencerUser[];
  messages: Message[];
  notifications: Notification[];
  conversations: Conversation[];
  
  fetchCampaigns: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  
  createCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => Promise<Campaign>;
  updateCampaign: (id: string, campaignData: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  applyToCampaign: (campaignId: string, influencerId?: string, status?: 'pending' | 'approved' | 'rejected', budgetAppliedFor?: number) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected') => Promise<void>;
  
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  getEligibleCampaigns: () => Campaign[];
  getEligibleInfluencers: (campaignId: string) => InfluencerUser[];
  blockInfluencer: (id: string) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  createNotification: (notificationData: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  hasApplied: (campaignId: string, influencerId: string) => boolean;
}

// Create the context with a default value
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create a provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*');
      
      if (error) throw error;
      
      // Map the database fields to our frontend model
      const mappedCampaigns: Campaign[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        minFollowers: item.min_followers,
        city: item.city || null,
        categories: item.categories,
        status: item.status,
        createdAt: item.created_at
      }));
      
      setCampaigns(mappedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };
  
  // Fetch applications from Supabase
  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*');
      
      if (error) throw error;
      
      // Map the database fields to our frontend model
      const mappedApplications: Application[] = data.map(item => ({
        id: item.id,
        campaignId: item.campaign_id,
        influencerId: item.influencer_id,
        budgetAppliedFor: item.budget_applied_for,
        isNegotiated: item.is_negotiated,
        finalOfferAmount: item.final_offer_amount,
        status: item.status,
        createdAt: item.created_at
      }));
      
      setApplications(mappedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  
  // Fetch influencers from Supabase
  const fetchInfluencers = async () => {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*');
      
      if (error) throw error;
      
      // Map the database fields to our frontend model
      const mappedInfluencers: InfluencerUser[] = data.map(item => ({
        id: item.id, // Keep the id field for compatibility with InfluencerUser type
        dbId: item.id,
        authId: item.auth_id,
        role: 'influencer',
        name: item.name,
        email: item.email,
        phone: item.phone || null,
        instagram: item.instagram || null,
        followerCount: item.follower_count,
        profileCompleted: item.profile_completed,
        categories: item.categories || [],
        city: item.city || null,
        createdAt: item.created_at
      }));
      
      setInfluencers(mappedInfluencers);
      console.log('Fetched influencers:', mappedInfluencers);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  };
  
  // Fetch messages from Supabase
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*');
      
      if (error) throw error;
      
      // Map the database fields to our frontend model
      const mappedMessages: Message[] = data.map(item => ({
        id: item.id,
        senderType: item.sender_type,
        senderId: item.sender_id,
        receiverType: item.receiver_type,
        receiverId: item.receiver_id,
        content: item.content,
        read: item.read || false,
        createdAt: item.created_at
      }));
      
      setMessages(mappedMessages);
      
      // Generate conversations from messages
      generateConversations(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Generate conversations from messages
  const generateConversations = (allMessages: Message[]) => {
    if (!user) return;
    
    const conversationMap = new Map<string, Conversation>();
    
    allMessages.forEach(message => {
      const isUserSender = message.senderType === user.role && message.senderId === user.dbId;
      const otherPersonId = isUserSender ? message.receiverId : message.senderId;
      const otherPersonType = isUserSender ? message.receiverType : message.senderType;
      
      const conversationKey = `${otherPersonType}-${otherPersonId}`;
      
      if (!conversationMap.has(conversationKey)) {
        // Find the name of the other person
        let name = 'Unknown';
        if (otherPersonType === 'influencer') {
          const influencer = influencers.find(inf => inf.dbId === otherPersonId);
          name = influencer?.name || 'Unknown Influencer';
        } else if (otherPersonType === 'admin') {
          name = 'Admin';
        }

        conversationMap.set(conversationKey, {
          id: conversationKey,
          participantId: otherPersonId,
          participantType: otherPersonType as 'admin' | 'influencer',
          name,
          messages: [],
          lastMessage: null,
          unread: 0
        });
      }
      
      const conversation = conversationMap.get(conversationKey)!;
      conversation.messages.push(message);
      
      // Check if this is a newer message than the current lastMessage
      if (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }
      
      // Count unread messages sent to the user
      if (!message.read && message.receiverType === user.role && message.receiverId === user.dbId) {
        conversation.unread++;
      }
    });
    
    // Sort conversations by the date of the last message (newest first)
    const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });
    
    setConversations(sortedConversations);
  };
  
  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*');
      
      if (error) throw error;
      
      // Map the database fields to our frontend model
      const mappedNotifications: Notification[] = data.map(item => ({
        id: item.id,
        type: item.type as "new_influencer" | "new_application" | "new_message" | "application_approved" | "application_rejected",
        message: item.message,
        targetType: item.target_type,
        targetId: item.target_id,
        userId: item.target_id, // Assuming userId is the same as targetId for now
        read: item.read || false,
        createdAt: item.created_at
      }));
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Create a new campaign
  const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => {
    try {
      // Ensure we only use allowed status values for the database
      // Fix: Remove the comparison with 'archived' since it's not in the allowed types
      const status = campaignData.status;
      
      // Convert to database field names
      const dbCampaign = {
        title: campaignData.title,
        description: campaignData.description,
        min_followers: campaignData.minFollowers,
        city: campaignData.city,
        categories: campaignData.categories,
        status: status
      };
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert(dbCampaign)
        .select()
        .single();
      
      if (error) throw error;
      
      // Format the campaign for our state
      const newCampaign: Campaign = {
        id: data.id,
        title: data.title,
        description: data.description,
        minFollowers: data.min_followers,
        city: data.city,
        categories: data.categories,
        status: data.status,
        createdAt: data.created_at
      };
      
      // Add to local state
      setCampaigns(prev => [...prev, newCampaign]);
      
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };
  
  // Update an existing campaign
  const updateCampaign = async (id: string, campaignData: Partial<Campaign>) => {
    try {
      // Convert to database field names
      const dbCampaign: any = {};
      if (campaignData.title !== undefined) dbCampaign.title = campaignData.title;
      if (campaignData.description !== undefined) dbCampaign.description = campaignData.description;
      if (campaignData.minFollowers !== undefined) dbCampaign.min_followers = campaignData.minFollowers;
      if (campaignData.city !== undefined) dbCampaign.city = campaignData.city;
      if (campaignData.categories !== undefined) dbCampaign.categories = campaignData.categories;
      
      // Handle status case - no need to convert since 'archived' is not in our type anymore
      if (campaignData.status !== undefined) {
        dbCampaign.status = campaignData.status;
      }
      
      const { error } = await supabase
        .from('campaigns')
        .update(dbCampaign)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setCampaigns(prev => prev.map(campaign => {
        if (campaign.id === id) {
          return { ...campaign, ...campaignData };
        }
        return campaign;
      }));
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  };
  
  // Delete a campaign
  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  };
  
  // Check if an influencer has applied to a campaign
  const hasApplied = (campaignId: string, influencerId: string) => {
    return applications.some(app => 
      app.campaignId === campaignId && app.influencerId === influencerId
    );
  };
  
  // Apply to a campaign
  const applyToCampaign = async (campaignId: string, influencerId?: string, status?: 'pending' | 'approved' | 'rejected', budgetAppliedFor?: number) => {
    // Use provided influencer ID or fall back to the current user ID
    const applicantId = influencerId || (user?.dbId || '');
    if (!applicantId) {
      console.error('No influencer ID available');
      return;
    }
    
    try {
      // Create the application
      const dbApplication = {
        campaign_id: campaignId,
        influencer_id: applicantId,
        budget_applied_for: budgetAppliedFor || null,
        is_negotiated: false,
        status: status || 'pending'
      };
      
      const { data, error } = await supabase
        .from('applications')
        .insert(dbApplication)
        .select()
        .single();
      
      if (error) throw error;
      
      // Format the application for our state
      const newApplication: Application = {
        id: data.id,
        campaignId: data.campaign_id,
        influencerId: data.influencer_id,
        budgetAppliedFor: data.budget_applied_for,
        isNegotiated: data.is_negotiated,
        finalOfferAmount: data.final_offer_amount,
        status: data.status,
        createdAt: data.created_at
      };
      
      // Update local state
      setApplications(prev => [...prev, newApplication]);
      
      // Create notification for admin
      await createNotification({
        type: 'new_application',
        message: `New application for campaign`,
        targetType: 'admin',
        targetId: 'admin', // Generic admin target
        userId: 'admin',
        read: false
      });
    } catch (error) {
      console.error('Error applying to campaign:', error);
      throw error;
    }
  };
  
  // Update application status
  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      // Get the application first to get the influencer ID
      const application = applications.find(app => app.id === applicationId);
      if (!application) throw new Error('Application not found');
      
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setApplications(prev => prev.map(app => {
        if (app.id === applicationId) {
          return { ...app, status };
        }
        return app;
      }));
      
      // Create notification for the influencer
      const notificationType = status === 'approved' ? 'application_approved' : 'application_rejected';
      const message = status === 'approved' 
        ? 'Your application has been approved!' 
        : 'Your application has been rejected.';
      
      await createNotification({
        type: notificationType,
        message,
        targetType: 'influencer',
        targetId: application.influencerId,
        userId: application.influencerId,
        read: false
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  };
  
  // Send message
  const sendMessage = async (receiverId: string, content: string) => {
    if (!user?.dbId) {
      console.error('User ID not available');
      return;
    }

    try {
      const receiverType = user.role === 'admin' ? 'influencer' : 'admin';
      
      // Convert to database field names
      const dbMessage = {
        sender_type: user.role as 'admin' | 'influencer',
        sender_id: user.dbId,
        receiver_type: receiverType as 'admin' | 'influencer',
        receiver_id: receiverId,
        content: content,
      };
      
      console.log('Sending message with data:', dbMessage);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(dbMessage)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Format the message for our state
        const newMessage: Message = {
          id: data[0].id,
          senderType: data[0].sender_type,
          senderId: data[0].sender_id,
          receiverType: data[0].receiver_type,
          receiverId: data[0].receiver_id,
          content: data[0].content,
          read: data[0].read || false,
          createdAt: data[0].created_at
        };
        
        // Update local state
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversations
        fetchMessages();
  
        // Create notification for the receiver
        await createNotification({
          type: 'new_message',
          message: `New message from ${user.name}`,
          targetType: receiverType as 'admin' | 'influencer',
          targetId: receiverId,
          userId: receiverId,
          read: false
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Create notification
  const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      // Convert to database field names
      const dbNotification = {
        type: notificationData.type,
        message: notificationData.message,
        target_type: notificationData.targetType,
        target_id: notificationData.targetId,
        read: notificationData.read || false,
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(dbNotification)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Format the notification for our state
        const newNotifications = data.map(item => ({
          id: item.id,
          type: item.type as "new_influencer" | "new_application" | "new_message" | "application_approved" | "application_rejected",
          message: item.message,
          targetType: item.target_type,
          targetId: item.target_id,
          userId: item.target_id, // Assuming userId is the same as targetId for now
          read: item.read || false,
          createdAt: item.created_at
        }));
        
        // Update local state
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('target_type', user.role)
        .eq('target_id', user.dbId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(notification => {
        if (notification.targetType === user.role && notification.targetId === user.dbId) {
          return { ...notification, read: true };
        }
        return notification;
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };
  
  // Get eligible campaigns for the current influencer
  const getEligibleCampaigns = () => {
    if (!user || user.role !== 'influencer') return [];
    
    return campaigns.filter(campaign => {
      // Only show active campaigns
      if (campaign.status !== 'active') return false;
      
      // Check if the user has already applied
      if (hasApplied(campaign.id, user.dbId)) return false;
      
      // We need to cast the user to InfluencerUser to access specific properties
      const influencer = user as InfluencerUser;
      
      // Check minimum followers requirement
      if (campaign.minFollowers && influencer.followerCount < campaign.minFollowers) {
        return false;
      }
      
      // Check city requirement if specified
      if (campaign.city && campaign.city !== influencer.city) {
        return false;
      }
      
      // Check category match if both have categories
      if (campaign.categories && campaign.categories.length > 0 && 
          influencer.categories && influencer.categories.length > 0) {
        // If there's at least one category match, include this campaign
        const match = campaign.categories.some(
          category => influencer.categories.includes(category)
        );
        return match;
      }
      
      return true;
    });
  };
  
  // Get eligible influencers for a campaign
  const getEligibleInfluencers = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return [];
    
    return influencers.filter(influencer => {
      // Check minimum followers requirement
      if (campaign.minFollowers && influencer.followerCount < campaign.minFollowers) {
        return false;
      }
      
      // Check city requirement if specified
      if (campaign.city && campaign.city !== influencer.city) {
        return false;
      }
      
      // Check category match if both have categories
      if (campaign.categories && campaign.categories.length > 0 && 
          influencer.categories && influencer.categories.length > 0) {
        // If there's at least one category match, include this influencer
        const match = campaign.categories.some(
          category => influencer.categories.includes(category)
        );
        return match;
      }
      
      return true;
    });
  };
  
  // Block an influencer (functionally same as deleting for now)
  const blockInfluencer = async (id: string) => {
    try {
      // For now, we'll just implement this as a delete operation
      await deleteInfluencer(id);
    } catch (error) {
      console.error('Error blocking influencer:', error);
      throw error;
    }
  };
  
  // Delete an influencer
  const deleteInfluencer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('influencers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setInfluencers(prev => prev.filter(influencer => influencer.dbId !== id));
    } catch (error) {
      console.error('Error deleting influencer:', error);
      throw error;
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchCampaigns();
    fetchApplications();
    fetchInfluencers();
    fetchMessages();
    fetchNotifications();
  }, []);
  
  // Reload relevant data when user changes
  useEffect(() => {
    if (user) {
      // Reload messages and regenerate conversations when user changes
      fetchMessages();
      fetchNotifications();
    }
  }, [user]);
  
  const contextValue: DataContextType = {
    campaigns,
    applications,
    influencers,
    messages,
    notifications,
    conversations,
    
    fetchCampaigns,
    fetchApplications,
    fetchInfluencers,
    fetchMessages,
    fetchNotifications,
    
    createCampaign,
    updateCampaign,
    deleteCampaign,
    
    applyToCampaign,
    updateApplicationStatus,
    
    sendMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    getEligibleCampaigns,
    getEligibleInfluencers,
    blockInfluencer,
    deleteInfluencer,
    createNotification,
    hasApplied
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

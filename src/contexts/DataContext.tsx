import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Campaign, Application, Message, Notification } from '@/types/data';
import { useAuth } from './AuthContext';
import { AdminUser, InfluencerUser, User } from '@/types/auth';

interface DataContextType {
  campaigns: Campaign[];
  applications: Application[];
  influencers: InfluencerUser[];
  messages: Message[];
  notifications: Notification[];
  adminId: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  applyToCampaign: (
    campaignId: string,
    influencerId?: string,
    status?: 'pending' | 'approved' | 'rejected',
    budgetAppliedFor?: number,
    isNegotiated?: boolean
  ) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: 'approved' | 'rejected') => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getEligibleCampaigns: () => Campaign[];
  isInfluencerEligible: (campaignId: string) => boolean;
  hasApplied: (campaignId: string, influencerId?: string) => boolean;
  getEligibleInfluencers: (campaignId: string) => InfluencerUser[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch admin ID on load
  useEffect(() => {
    const fetchAdminId = async () => {
      if (user?.role === 'admin' && user.id) {
        const { data, error } = await supabase.functions.invoke('get-admin-id', {
          body: { user_id: user.id },
        });

        if (error) {
          console.error('Error fetching admin ID:', error);
        } else if (data) {
          setAdminId(data);
        }
      }
    };

    fetchAdminId();
  }, [user?.role, user?.id]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }, []);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  // Fetch influencers
  const fetchInfluencers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInfluencers(data);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Create campaign
  const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  // Update campaign
  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (error) throw error;

      // Update local state
      setCampaigns(prev =>
        prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, ...updates } : campaign
        )
      );
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  };

  // Delete campaign
  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      // Update local state
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  };

  // Updated applyToCampaign function to handle budget details
  const applyToCampaign = async (
    campaignId: string,
    influencerId?: string, 
    status: 'pending' | 'approved' | 'rejected' = 'pending',
    budgetAppliedFor?: number,
    isNegotiated: boolean = false
  ) => {
    try {
      // Use current user's influencer ID if not specified
      const applicantId = influencerId || user?.dbId;
      
      if (!applicantId) {
        throw new Error('No influencer ID available to apply with');
      }

      // Check if already applied
      const existingApp = applications.find(
        app => app.campaignId === campaignId && app.influencerId === applicantId
      );

      if (existingApp) {
        throw new Error('You have already applied to this campaign');
      }

      // Submit the application
      const { data, error } = await supabase
        .from('applications')
        .insert({
          campaign_id: campaignId,
          influencer_id: applicantId,
          status: status,
          budget_applied_for: budgetAppliedFor,
          is_negotiated: isNegotiated
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const newApplication = {
        id: data.id,
        campaignId: data.campaign_id,
        influencerId: data.influencer_id,
        status: data.status,
        createdAt: data.created_at,
        budgetAppliedFor: data.budget_applied_for,
        isNegotiated: data.is_negotiated || false,
        finalOfferAmount: data.final_offer_amount
      };

      setApplications(prev => [...prev, newApplication]);

      // Create notification for admin
      await createNotification({
        type: 'new_application',
        message: `New application for "${campaigns.find(c => c.id === campaignId)?.title}" campaign`,
        targetType: 'admin',
        targetId: adminId || '', // If adminId is not loaded yet, it will be empty
      });

    } catch (error) {
      console.error('Error applying to campaign:', error);
      throw error;
    }
  };

  // Update application status
  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status } 
            : app
        )
      );

      // Find the application and influencer to notify
      const application = applications.find(app => app.id === applicationId);

      if (application) {
        // Get the campaign name
        const campaign = campaigns.find(c => c.id === application.campaignId);
        const campaignName = campaign?.title || 'a campaign';

        // Create notification for the influencer
        await createNotification({
          type: status === 'approved' ? 'application_approved' : 'application_rejected',
          message: `Your application for ${campaignName} has been ${status}`,
          targetType: 'influencer',
          targetId: application.influencerId,
        });
      }
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_type: user.role,
          sender_id: user.dbId,
          receiver_type: receiverType,
          receiver_id: receiverId,
          content: content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setMessages(prev => [...prev, data]);

      // Create notification for the receiver
      await createNotification({
        type: 'new_message',
        message: `New message from ${user.name}`,
        targetType: receiverType,
        targetId: receiverId,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Create notification
  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setNotifications(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating notification:', error);
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
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Get eligible campaigns
  const getEligibleCampaigns = () => {
    if (!user) return [];

    return campaigns.filter(campaign => {
      if (campaign.status !== 'active') return false;
      if (campaign.minFollowers && user.followerCount && user.followerCount < campaign.minFollowers) return false;
      if (campaign.city && user.city && campaign.city !== user.city) return false;
      if (campaign.categories && user.categories && !campaign.categories.some(cat => user.categories?.includes(cat))) return false;

      return true;
    });
  };

  // Check if influencer is eligible for a campaign
  const isInfluencerEligible = (campaignId: string) => {
    if (!user) return false;

    const campaign = campaigns.find(campaign => campaign.id === campaignId);

    if (!campaign) return false;
    if (campaign.status !== 'active') return false;
    if (campaign.minFollowers && user.followerCount && user.followerCount < campaign.minFollowers) return false;
    if (campaign.city && user.city && campaign.city !== user.city) return false;
    if (campaign.categories && user.categories && !campaign.categories.some(cat => user.categories?.includes(cat))) return false;

    return true;
  };

  // Check if influencer has applied to a campaign
  const hasApplied = (campaignId: string, influencerId?: string) => {
    const id = influencerId || user?.dbId;
    return applications.some(application => application.campaignId === campaignId && application.influencerId === id);
  };

  // Get eligible influencers for a campaign
  const getEligibleInfluencers = (campaignId: string) => {
    const campaign = campaigns.find(campaign => campaign.id === campaignId);

    if (!campaign) return [];

    return influencers.filter(influencer => {
      if (campaign.minFollowers && influencer.followerCount && influencer.followerCount < campaign.minFollowers) return false;
      if (campaign.city && influencer.city && campaign.city !== influencer.city) return false;
      if (campaign.categories && influencer.categories && !campaign.categories.some(cat => influencer.categories?.includes(cat))) return false;

      return true;
    });
  };

  // Initial data fetch
  useEffect(() => {
    fetchCampaigns();
    fetchApplications();
    fetchInfluencers();
    fetchMessages();
    fetchNotifications();
  }, [fetchCampaigns, fetchApplications, fetchInfluencers, fetchMessages, fetchNotifications]);

  // Realtime campaign subscription
  useEffect(() => {
    const channel = supabase
      .channel('campaigns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        (payload) => {
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCampaigns]);

  // Realtime application subscription
  useEffect(() => {
    const channel = supabase
      .channel('applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        (payload) => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications]);

  // Realtime influencer subscription
  useEffect(() => {
    const channel = supabase
      .channel('influencers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'influencers' },
        (payload) => {
          fetchInfluencers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInfluencers]);

  // Realtime notification subscription
  useEffect(() => {
    if (!user?.dbId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `target_id=eq.${user.dbId}`
        },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user?.dbId]);

  const value: DataContextType = {
    campaigns,
    applications,
    influencers,
    messages,
    notifications,
    adminId,
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
    createNotification,
    markNotificationAsRead,
    getEligibleCampaigns,
    isInfluencerEligible,
    hasApplied,
    getEligibleInfluencers,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

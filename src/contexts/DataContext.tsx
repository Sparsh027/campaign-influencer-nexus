import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Campaign, Application, Message, Notification, CampaignPhase, InfluencerVisibility } from '@/types/data';
import { useAuth } from './AuthContext';
import { AdminUser, InfluencerUser, User } from '@/types/auth';

interface DataContextType {
  campaigns: Campaign[];
  applications: Application[];
  influencers: InfluencerUser[];
  messages: Message[];
  notifications: Notification[];
  campaignPhases: CampaignPhase[];
  influencerVisibilities: InfluencerVisibility[];
  adminId: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchCampaignPhases: (campaignId?: string) => Promise<void>;
  fetchInfluencerVisibilities: (campaignId?: string) => Promise<void>;
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
  createCampaignPhase: (phase: Omit<CampaignPhase, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaignPhase: (phaseId: string, updates: Partial<CampaignPhase>) => Promise<void>;
  deleteCampaignPhase: (phaseId: string) => Promise<void>;
  updateInfluencerVisibility: (
    influencerId: string,
    campaignId: string,
    updates: Partial<InfluencerVisibility>
  ) => Promise<void>;
  getInfluencerVisibility: (influencerId: string, campaignId: string) => InfluencerVisibility | undefined;
  getActiveCampaignPhase: (campaignId: string) => CampaignPhase | undefined;
  getVisibleBudgetForInfluencer: (influencerId: string, campaignId: string) => number | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [campaignPhases, setCampaignPhases] = useState<CampaignPhase[]>([]);
  const [influencerVisibilities, setInfluencerVisibilities] = useState<InfluencerVisibility[]>([]);
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

      // Map database fields to our interface properties
      const formattedCampaigns: Campaign[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        minFollowers: item.min_followers || 0,
        categories: item.categories,
        city: item.city || '',
        status: item.status || 'draft',
        createdAt: item.created_at
      }));

      setCampaigns(formattedCampaigns);
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

      // Map database fields to our interface properties
      const formattedApplications: Application[] = data.map(item => ({
        id: item.id,
        campaignId: item.campaign_id,
        influencerId: item.influencer_id,
        status: item.status || 'pending',
        createdAt: item.created_at,
        budgetAppliedFor: item.budget_applied_for,
        isNegotiated: item.is_negotiated || false,
        finalOfferAmount: item.final_offer_amount
      }));

      setApplications(formattedApplications);
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

      // Map database fields to our interface properties
      const formattedInfluencers: InfluencerUser[] = data.map(item => ({
        id: item.auth_id || '',  // Auth ID from supabase
        dbId: item.id, // Database ID from influencers table
        email: item.email,
        name: item.name,
        role: 'influencer' as const,
        instagram: item.instagram,
        followerCount: item.follower_count,
        phone: item.phone,
        categories: item.categories,
        city: item.city,
        profileCompleted: item.profile_completed || false,
        createdAt: item.created_at
      }));

      setInfluencers(formattedInfluencers);
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

      // Map database fields to our interface properties
      const formattedMessages: Message[] = data.map(item => ({
        id: item.id,
        senderType: item.sender_type,
        senderId: item.sender_id,
        receiverType: item.receiver_type,
        receiverId: item.receiver_id,
        content: item.content,
        read: item.read || false,
        createdAt: item.created_at
      }));

      setMessages(formattedMessages);
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

      // Map database fields to our interface properties
      const formattedNotifications: Notification[] = data.map(item => ({
        id: item.id,
        type: item.type as any, // Cast to handle extended notification types
        message: item.message,
        targetType: item.target_type,
        targetId: item.target_id,
        userId: item.target_id, // Using targetId as userId for backward compatibility
        read: item.read || false,
        createdAt: item.created_at
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Fetch campaign phases
  const fetchCampaignPhases = useCallback(async (campaignId?: string) => {
    try {
      let query = supabase
        .from('campaign_phases')
        .select('*')
        .order('phase_number', { ascending: true });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // Map database fields to our interface properties
      const formattedPhases: CampaignPhase[] = data.map(item => ({
        id: item.id,
        campaignId: item.campaign_id,
        phaseNumber: item.phase_number,
        budgetAmount: item.budget_amount,
        isActive: item.is_active || false,
        createdAt: item.created_at || new Date().toISOString()
      }));

      setCampaignPhases(formattedPhases);
    } catch (error) {
      console.error('Error fetching campaign phases:', error);
    }
  }, []);

  // Fetch influencer visibilities
  const fetchInfluencerVisibilities = useCallback(async (campaignId?: string) => {
    try {
      let query = supabase
        .from('influencer_campaign_visibility')
        .select('*');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // Map database fields to our interface properties
      const formattedVisibilities: InfluencerVisibility[] = data.map(item => ({
        id: item.id,
        influencerId: item.influencer_id,
        campaignId: item.campaign_id,
        assignedPhase: item.assigned_phase,
        negotiationVisible: item.negotiation_visible || false,
        customOfferAmount: item.custom_offer_amount
      }));

      setInfluencerVisibilities(formattedVisibilities);
    } catch (error) {
      console.error('Error fetching influencer visibilities:', error);
    }
  }, []);

  // Create campaign
  const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt'>) => {
    try {
      // Convert from our interface to database fields
      const dbCampaign = {
        title: campaign.title,
        description: campaign.description,
        min_followers: campaign.minFollowers,
        categories: campaign.categories,
        city: campaign.city,
        status: campaign.status
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert([dbCampaign])
        .select()
        .single();

      if (error) throw error;

      // Map the response back to our interface
      const newCampaign: Campaign = {
        id: data.id,
        title: data.title,
        description: data.description,
        minFollowers: data.min_followers || 0,
        categories: data.categories,
        city: data.city || '',
        status: data.status || 'draft',
        createdAt: data.created_at
      };

      setCampaigns(prev => [...prev, newCampaign]);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  // Update campaign
  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>) => {
    try {
      // Convert from our interface to database fields
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.minFollowers !== undefined) dbUpdates.min_followers = updates.minFollowers;
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await supabase
        .from('campaigns')
        .update(dbUpdates)
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

      // Convert to database field names
      const dbApplication = {
        campaign_id: campaignId,
        influencer_id: applicantId,
        status: status,
        budget_applied_for: budgetAppliedFor,
        is_negotiated: isNegotiated
      };

      // Submit the application
      const { data, error } = await supabase
        .from('applications')
        .insert(dbApplication)
        .select()
        .single();

      if (error) throw error;

      // Update local state with properly formatted application
      const newApplication: Application = {
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
      const campaignTitle = campaigns.find(c => c.id === campaignId)?.title || 'a campaign';
      await createNotification({
        type: 'new_application',
        message: `New application for "${campaignTitle}" campaign`,
        targetType: 'admin',
        targetId: adminId || '',
        userId: applicantId,
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
          type: status === 'approved' ? 'application_approved' : 'application_rejected' as any,
          message: `Your application for ${campaignName} has been ${status}`,
          targetType: 'influencer',
          targetId: application.influencerId,
          userId: application.influencerId,
          read: false
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
      
      // Convert to database field names
      const dbMessage = {
        sender_type: user.role,
        sender_id: user.dbId,
        receiver_type: receiverType,
        receiver_id: receiverId,
        content: content,
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(dbMessage)
        .select()
        .single();

      if (error) throw error;

      // Format the message for our state
      const newMessage: Message = {
        id: data.id,
        senderType: data.sender_type,
        senderId: data.sender_id,
        receiverType: data.receiver_type,
        receiverId: data.receiver_id,
        content: data.content,
        read: data.read || false,
        createdAt: data.created_at
      };
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);

      // Create notification for the receiver
      await createNotification({
        type: 'new_message',
        message: `New message from ${user.name}`,
        targetType: receiverType,
        targetId: receiverId,
        userId: receiverId,
        read: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Create notification
  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      // Convert to database field names
      const dbNotification = {
        type: notification.type,
        message: notification.message,
        target_type: notification.targetType,
        target_id: notification.targetId,
        read: notification.read
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([dbNotification])
        .select()
        .single();

      if (error) throw error;

      // Format the notification for our state
      const newNotification: Notification = {
        id: data.id,
        type: data.type as any,
        message: data.message,
        targetType: data.target_type,
        targetId: data.target_id,
        userId: data.target_id, // Using targetId as userId
        read: data.read || false,
        createdAt: data.created_at
      };
      
      // Update local state
      setNotifications(prev => [...prev, newNotification]);
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

  // Create campaign phase
  const createCampaignPhase = async (phase: Omit<CampaignPhase, 'id' | 'createdAt'>) => {
    try {
      // Convert to database field names
      const dbPhase = {
        campaign_id: phase.campaignId,
        phase_number: phase.phaseNumber,
        budget_amount: phase.budgetAmount,
        is_active: phase.isActive
      };
      
      const { data, error } = await supabase
        .from('campaign_phases')
        .insert([dbPhase])
        .select()
        .single();

      if (error) throw error;

      // Format for our state
      const newPhase: CampaignPhase = {
        id: data.id,
        campaignId: data.campaign_id,
        phaseNumber: data.phase_number,
        budgetAmount: data.budget_amount,
        isActive: data.is_active || false,
        createdAt: data.created_at
      };
      
      setCampaignPhases(prev => [...prev, newPhase]);
    } catch (error) {
      console.error('Error creating campaign phase:', error);
      throw error;
    }
  };

  // Update campaign phase
  const updateCampaignPhase = async (phaseId: string, updates: Partial<CampaignPhase>) => {
    try {
      // Convert to database field names
      const dbUpdates: any = {};
      if (updates.phaseNumber !== undefined) dbUpdates.phase_number = updates.phaseNumber;
      if (updates.budgetAmount !== undefined) dbUpdates.budget_amount = updates.budgetAmount;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      
      const { error } = await supabase
        .from('campaign_phases')
        .update(dbUpdates)
        .eq('id', phaseId);

      if (error) throw error;

      // Update local state
      setCampaignPhases(prev =>
        prev.map(phase =>
          phase.id === phaseId ? { ...phase, ...updates } : phase
        )
      );
    } catch (error) {
      console.error('Error updating campaign phase:', error);
      throw error;
    }
  };

  // Delete campaign phase
  const deleteCampaignPhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      // Update local state
      setCampaignPhases(prev => prev.filter(phase => phase.id !== phaseId));
    } catch (error) {
      console.error('Error deleting campaign phase:', error);
      throw error;
    }
  };

  // Update influencer visibility
  const updateInfluencerVisibility = async (
    influencerId: string,
    campaignId: string,
    updates: Partial<InfluencerVisibility>
  ) => {
    try {
      // Check if a record already exists for this influencer and campaign
      const existing = influencerVisibilities.find(
        v => v.influencerId === influencerId && v.campaignId === campaignId
      );

      // Convert to database field names
      const dbUpdates: any = {
        influencer_id: influencerId,
        campaign_id: campaignId
      };
      
      if (updates.assignedPhase !== undefined) dbUpdates.assigned_phase = updates.assignedPhase;
      if (updates.negotiationVisible !== undefined) dbUpdates.negotiation_visible = updates.negotiationVisible;
      if (updates.customOfferAmount !== undefined) dbUpdates.custom_offer_amount = updates.customOfferAmount;

      let result;
      
      if (existing) {
        // Update existing record
        result = await supabase
          .from('influencer_campaign_visibility')
          .update(dbUpdates)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('influencer_campaign_visibility')
          .insert(dbUpdates)
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) throw error;

      // Format for our state
      const updatedVisibility: InfluencerVisibility = {
        id: data.id,
        influencerId: data.influencer_id,
        campaignId: data.campaign_id,
        assignedPhase: data.assigned_phase,
        negotiationVisible: data.negotiation_visible || false,
        customOfferAmount: data.custom_offer_amount
      };

      // Update local state
      if (existing) {
        setInfluencerVisibilities(prev =>
          prev.map(v => v.id === existing.id ? updatedVisibility : v)
        );
      } else {
        setInfluencerVisibilities(prev => [...prev, updatedVisibility]);
      }
      
    } catch (error) {
      console.error('Error updating influencer visibility:', error);
      throw error;
    }
  };

  // Get influencer visibility
  const getInfluencerVisibility = (influencerId: string, campaignId: string) => {
    return influencerVisibilities.find(
      v => v.influencerId === influencerId && v.campaignId === campaignId
    );
  };

  // Get active campaign phase
  const getActiveCampaignPhase = (campaignId: string) => {
    // Get all phases for this campaign, sorted by phase number descending
    const phases = campaignPhases
      .filter(p => p.campaignId === campaignId && p.isActive)
      .sort((a, b) => b.phaseNumber - a.phaseNumber);
    
    // Return the highest phase number that is active
    return phases[0];
  };

  // Get visible budget for an influencer
  const getVisibleBudgetForInfluencer = (influencerId: string, campaignId: string): number | null => {
    // If the influencer has already applied, they shouldn't see any budget
    if (hasApplied(campaignId, influencerId)) {
      const application = applications.find(
        a => a.campaignId === campaignId && a.influencerId === influencerId
      );
      return application?.budgetAppliedFor || null;
    }
    
    // Check if there's a custom visibility setting
    const visibility = getInfluencerVisibility(influencerId, campaignId);
    
    if (visibility) {
      // If there's a custom offer amount, return that
      if (visibility.customOfferAmount) {
        return visibility.customOfferAmount;
      }
      
      // If there's an assigned phase, find and return that phase's budget
      if (visibility.assignedPhase !== null) {
        const assignedPhase = campaignPhases.find(
          p => p.campaignId === campaignId && p.phaseNumber === visibility.assignedPhase
        );
        if (assignedPhase) {
          return assignedPhase.budgetAmount;
        }
      }
    }
    
    // Otherwise, return the latest active phase's budget
    const activePhase = getActiveCampaignPhase(campaignId);
    return activePhase?.budgetAmount || null;
  };

  // Initial data fetch
  useEffect(() => {
    fetchCampaigns();
    fetchApplications();
    fetchInfluencers();
    fetchMessages();
    fetchNotifications();
    fetchCampaignPhases();
    fetchInfluencerVisibilities();
  }, [fetchCampaigns, fetchApplications, fetchInfluencers, fetchMessages, fetchNotifications, fetchCampaignPhases, fetchInfluencerVisibilities]);

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

  // Realtime campaign phases subscription
  useEffect(() => {
    const channel = supabase
      .channel('campaign_phases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_phases' },
        (payload) => {
          fetchCampaignPhases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCampaignPhases]);

  // Realtime influencer visibility subscription
  useEffect(() => {
    const channel = supabase
      .channel('influencer_visibility')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'influencer_campaign_visibility' },
        (payload) => {
          fetchInfluencerVisibilities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInfluencerVisibilities]);

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
    campaignPhases,
    influencerVisibilities,
    adminId,
    fetchCampaigns,
    fetchApplications,
    fetchInfluencers,
    fetchMessages,
    fetchNotifications,
    fetchCampaignPhases,
    fetchInfluencerVisibilities,
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
    createCampaignPhase,
    updateCampaignPhase,
    deleteCampaignPhase,
    updateInfluencerVisibility,
    getInfluencerVisibility,
    getActiveCampaignPhase,
    getVisibleBudgetForInfluencer,
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

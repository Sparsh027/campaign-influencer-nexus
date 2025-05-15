import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CampaignPhase, InfluencerVisibility } from '@/types/data';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCampaignBudget(campaignId: string) {
  const { user } = useAuth();
  const [phases, setPhases] = useState<CampaignPhase[]>([]);
  const [visibilitySettings, setVisibilitySettings] = useState<InfluencerVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch campaign phases
  const fetchPhases = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_phases')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('phase_number', { ascending: true });
      
      if (error) throw error;
      
      // Format data to match our interface
      const formattedPhases: CampaignPhase[] = data.map(phase => ({
        id: phase.id,
        campaignId: phase.campaign_id,
        phaseNumber: phase.phase_number,
        budgetAmount: phase.budget_amount,
        isActive: phase.is_active || false,
        createdAt: phase.created_at
      }));
      
      setPhases(formattedPhases);
    } catch (error) {
      console.error('Error fetching campaign phases:', error);
      toast.error('Failed to load campaign phases');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Fetch visibility settings for a campaign
  const fetchVisibilitySettings = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      const { data, error } = await supabase
        .from('influencer_campaign_visibility')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      
      // Format data to match our interface
      const formattedSettings: InfluencerVisibility[] = data.map(setting => ({
        id: setting.id,
        influencerId: setting.influencer_id,
        campaignId: setting.campaign_id,
        assignedPhase: setting.assigned_phase,
        negotiationVisible: setting.negotiation_visible || false,
        customOfferAmount: setting.custom_offer_amount
      }));
      
      setVisibilitySettings(formattedSettings);
    } catch (error) {
      console.error('Error fetching visibility settings:', error);
      toast.error('Failed to load influencer settings');
    }
  }, [campaignId]);

  // Create a new campaign phase
  const createPhase = async (phaseData: Omit<CampaignPhase, 'id' | 'createdAt'>) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('campaign_phases')
        .insert({
          campaign_id: phaseData.campaignId,
          phase_number: phaseData.phaseNumber,
          budget_amount: phaseData.budgetAmount,
          is_active: phaseData.isActive
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Format new phase
      const newPhase: CampaignPhase = {
        id: data.id,
        campaignId: data.campaign_id,
        phaseNumber: data.phase_number,
        budgetAmount: data.budget_amount,
        isActive: data.is_active || false,
        createdAt: data.created_at
      };
      
      // Update local state
      setPhases(prev => [...prev, newPhase].sort((a, b) => a.phaseNumber - b.phaseNumber));
      
      toast.success('Campaign phase created successfully');
      return newPhase;
    } catch (error) {
      console.error('Error creating phase:', error);
      toast.error('Failed to create phase');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Update a campaign phase
  const updatePhase = async (phaseId: string, updates: Partial<CampaignPhase>) => {
    setSubmitting(true);
    try {
      // Convert to database column names
      const dbUpdates: any = {};
      if (updates.phaseNumber !== undefined) dbUpdates.phase_number = updates.phaseNumber;
      if (updates.budgetAmount !== undefined) dbUpdates.budget_amount = updates.budgetAmount;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      
      const { data, error } = await supabase
        .from('campaign_phases')
        .update(dbUpdates)
        .eq('id', phaseId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Format updated phase
      const updatedPhase: CampaignPhase = {
        id: data.id,
        campaignId: data.campaign_id,
        phaseNumber: data.phase_number,
        budgetAmount: data.budget_amount,
        isActive: data.is_active || false,
        createdAt: data.created_at
      };
      
      // Update local state
      setPhases(prev => 
        prev.map(phase => phase.id === phaseId ? updatedPhase : phase)
          .sort((a, b) => a.phaseNumber - b.phaseNumber)
      );
      
      toast.success('Phase updated successfully');
      return updatedPhase;
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update phase');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a campaign phase
  const deletePhase = async (phaseId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('campaign_phases')
        .delete()
        .eq('id', phaseId);
      
      if (error) throw error;
      
      // Update local state
      setPhases(prev => prev.filter(phase => phase.id !== phaseId));
      
      toast.success('Phase deleted successfully');
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error('Failed to delete phase');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Update influencer visibility settings
  const updateInfluencerVisibility = async (
    influencerId: string, 
    updates: Partial<Omit<InfluencerVisibility, 'id' | 'influencerId' | 'campaignId'>>
  ) => {
    setSubmitting(true);
    try {
      // Check if entry exists already
      const { data: existingSettings } = await supabase
        .from('influencer_campaign_visibility')
        .select('id')
        .eq('influencer_id', influencerId)
        .eq('campaign_id', campaignId)
        .maybeSingle();
      
      // Convert to database column names
      const dbUpdates: any = {};
      if (updates.assignedPhase !== undefined) dbUpdates.assigned_phase = updates.assignedPhase;
      if (updates.negotiationVisible !== undefined) dbUpdates.negotiation_visible = updates.negotiationVisible;
      if (updates.customOfferAmount !== undefined) dbUpdates.custom_offer_amount = updates.customOfferAmount;
      
      let result;
      
      if (existingSettings) {
        // Update existing record
        const { data, error } = await supabase
          .from('influencer_campaign_visibility')
          .update(dbUpdates)
          .eq('id', existingSettings.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('influencer_campaign_visibility')
          .insert({
            influencer_id: influencerId,
            campaign_id: campaignId,
            ...dbUpdates
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      // Format updated setting
      const updatedSetting: InfluencerVisibility = {
        id: result.id,
        influencerId: result.influencer_id,
        campaignId: result.campaign_id,
        assignedPhase: result.assigned_phase,
        negotiationVisible: result.negotiation_visible || false,
        customOfferAmount: result.custom_offer_amount
      };
      
      // Update local state
      setVisibilitySettings(prev => {
        const existing = prev.find(s => s.influencerId === influencerId);
        if (existing) {
          return prev.map(s => s.influencerId === influencerId ? updatedSetting : s);
        } else {
          return [...prev, updatedSetting];
        }
      });
      
      toast.success('Settings updated successfully');
      return updatedSetting;
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update influencer settings');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // For an influencer, get the budget they should see
  const getInfluencerBudget = useCallback((influencerId: string) => {
    // Check if there's a custom visibility setting for this influencer
    const visibilitySetting = visibilitySettings.find(
      setting => setting.influencerId === influencerId
    );
    
    // If there's a custom offer amount, use that
    if (visibilitySetting?.customOfferAmount) {
      return visibilitySetting.customOfferAmount;
    }
    
    // If there's an assigned phase, use that budget
    if (visibilitySetting?.assignedPhase) {
      const assignedPhase = phases.find(
        phase => phase.phaseNumber === visibilitySetting.assignedPhase
      );
      if (assignedPhase) return assignedPhase.budgetAmount;
    }
    
    // Otherwise, use the latest active phase
    const activePhases = phases.filter(phase => phase.isActive);
    if (activePhases.length > 0) {
      // Get the highest phase number that is active
      const latestActivePhase = activePhases.sort((a, b) => 
        b.phaseNumber - a.phaseNumber
      )[0];
      return latestActivePhase.budgetAmount;
    }
    
    // If no active phases, return 0
    return 0;
  }, [phases, visibilitySettings]);

  // Check if negotiation is enabled for an influencer
  const isNegotiationEnabled = useCallback((influencerId: string) => {
    const visibilitySetting = visibilitySettings.find(
      setting => setting.influencerId === influencerId
    );
    return visibilitySetting?.negotiationVisible || false;
  }, [visibilitySettings]);

  // Initial data fetch
  useEffect(() => {
    if (campaignId) {
      fetchPhases();
      fetchVisibilitySettings();
    }
  }, [campaignId, fetchPhases, fetchVisibilitySettings]);

  // Set up real-time subscription for budget and visibility changes
  useEffect(() => {
    if (!campaignId) return;
    
    const phasesChannel = supabase
      .channel('campaign-phases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_phases',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => fetchPhases()
      )
      .subscribe();

    const visibilityChannel = supabase
      .channel('visibility-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'influencer_campaign_visibility',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => fetchVisibilitySettings()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(phasesChannel);
      supabase.removeChannel(visibilityChannel);
    };
  }, [campaignId, fetchPhases, fetchVisibilitySettings]);

  return {
    phases,
    visibilitySettings,
    loading,
    submitting,
    createPhase,
    updatePhase,
    deletePhase,
    updateInfluencerVisibility,
    getInfluencerBudget,
    isNegotiationEnabled,
    // Export refetch methods
    fetchPhases,
    fetchVisibilitySettings
  };
}

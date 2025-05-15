
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CampaignPhase, InfluencerVisibility } from '@/types/data';
import { useAuth } from '@/contexts/AuthContext';

export function useInfluencerBudget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaignBudgets, setCampaignBudgets] = useState<Record<string, number>>({});
  const [negotiationSettings, setNegotiationSettings] = useState<Record<string, boolean>>({});
  
  // Fetch budget visibility settings for the current influencer
  const fetchBudgetVisibility = useCallback(async () => {
    if (!user?.dbId) return;
    
    try {
      // Get all visibility settings for this influencer
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('influencer_campaign_visibility')
        .select('*')
        .eq('influencer_id', user.dbId);
        
      if (visibilityError) throw visibilityError;
      
      // Get all active campaign phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('campaign_phases')
        .select('*')
        .eq('is_active', true);
        
      if (phasesError) throw phasesError;
      
      // Format data
      const visibilitySettings: InfluencerVisibility[] = visibilityData.map(setting => ({
        id: setting.id,
        influencerId: setting.influencer_id,
        campaignId: setting.campaign_id,
        assignedPhase: setting.assigned_phase,
        negotiationVisible: setting.negotiation_visible || false,
        customOfferAmount: setting.custom_offer_amount
      }));
      
      const phases: CampaignPhase[] = phasesData.map(phase => ({
        id: phase.id,
        campaignId: phase.campaign_id,
        phaseNumber: phase.phase_number,
        budgetAmount: phase.budget_amount,
        isActive: phase.is_active || false,
        createdAt: phase.created_at
      }));
      
      // Build campaign budget map
      const budgets: Record<string, number> = {};
      const negotiations: Record<string, boolean> = {};
      
      // First, map default budgets from active phases (highest phase number wins)
      const campaignPhases: Record<string, CampaignPhase[]> = {};
      phases.forEach(phase => {
        if (!campaignPhases[phase.campaignId]) {
          campaignPhases[phase.campaignId] = [];
        }
        campaignPhases[phase.campaignId].push(phase);
      });
      
      // Set default budgets from the highest phase number for each campaign
      Object.keys(campaignPhases).forEach(campaignId => {
        const sortedPhases = campaignPhases[campaignId].sort((a, b) => b.phaseNumber - a.phaseNumber);
        if (sortedPhases.length > 0) {
          budgets[campaignId] = sortedPhases[0].budgetAmount;
        }
      });
      
      // Then, override with specific visibility settings
      visibilitySettings.forEach(setting => {
        // Set negotiation visibility
        negotiations[setting.campaignId] = setting.negotiationVisible;
        
        // If there's a custom offer amount, use that
        if (setting.customOfferAmount !== null) {
          budgets[setting.campaignId] = setting.customOfferAmount;
          return;
        }
        
        // If there's a specific phase assigned, find its budget
        if (setting.assignedPhase) {
          const assignedPhase = phases.find(
            p => p.campaignId === setting.campaignId && p.phaseNumber === setting.assignedPhase
          );
          
          if (assignedPhase) {
            budgets[setting.campaignId] = assignedPhase.budgetAmount;
          }
        }
      });
      
      setCampaignBudgets(budgets);
      setNegotiationSettings(negotiations);
    } catch (error) {
      console.error('Error fetching budget visibility:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.dbId]);
  
  // Get budget for a specific campaign
  const getCampaignBudget = useCallback((campaignId: string): number => {
    return campaignBudgets[campaignId] || 0;
  }, [campaignBudgets]);
  
  // Check if negotiation is enabled for a campaign
  const isNegotiationEnabled = useCallback((campaignId: string): boolean => {
    return negotiationSettings[campaignId] || false;
  }, [negotiationSettings]);
  
  // Initial fetch
  useEffect(() => {
    fetchBudgetVisibility();
  }, [fetchBudgetVisibility]);

  // Set up real-time subscription for budget changes
  useEffect(() => {
    if (!user?.dbId) return;
    
    // Listen for changes to visibility settings for this influencer
    const visibilityChannel = supabase
      .channel('influencer-visibility-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'influencer_campaign_visibility',
          filter: `influencer_id=eq.${user.dbId}`
        },
        () => fetchBudgetVisibility()
      )
      .subscribe();
      
    // Also listen for changes to campaign phases
    const phasesChannel = supabase
      .channel('campaign-phases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_phases'
        },
        () => fetchBudgetVisibility()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(visibilityChannel);
      supabase.removeChannel(phasesChannel);
    };
  }, [user?.dbId, fetchBudgetVisibility]);
  
  return {
    loading,
    getCampaignBudget,
    isNegotiationEnabled
  };
}

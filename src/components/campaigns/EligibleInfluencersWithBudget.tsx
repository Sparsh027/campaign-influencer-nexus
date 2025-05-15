
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCampaignBudget } from '@/hooks/useCampaignBudget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EligibleInfluencersWithBudgetProps {
  campaignId: string;
}

export default function EligibleInfluencersWithBudget({ campaignId }: EligibleInfluencersWithBudgetProps) {
  const { 
    getEligibleInfluencers, 
    hasApplied, 
    applications, 
    updateApplicationStatus, 
    applyToCampaign 
  } = useData();
  const {
    phases,
    visibilitySettings,
    updateInfluencerVisibility,
    getInfluencerBudget,
    isNegotiationEnabled,
    loading: budgetLoading
  } = useCampaignBudget(campaignId);
  const navigate = useNavigate();
  
  const [updatingInfluencer, setUpdatingInfluencer] = useState<string | null>(null);
  const [customBudgetDialogOpen, setCustomBudgetDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [customBudgetAmount, setCustomBudgetAmount] = useState<number>(0);
  
  const eligibleInfluencers = getEligibleInfluencers(campaignId);
  
  // Get application status for an influencer
  const getApplicationStatus = (influencerId: string) => {
    const application = applications.find(
      app => app.campaignId === campaignId && app.influencerId === influencerId
    );
    return application ? application.status : null;
  };

  // Get application ID for an influencer
  const getApplicationId = (influencerId: string) => {
    const application = applications.find(
      app => app.campaignId === campaignId && app.influencerId === influencerId
    );
    return application ? application.id : null;
  };
  
  // Handle status change
  const handleStatusChange = async (influencerId: string, status: string) => {
    try {
      setUpdatingInfluencer(influencerId);
      const applicationId = getApplicationId(influencerId);
      
      if (applicationId) {
        // Update existing application
        await updateApplicationStatus(applicationId, status as 'approved' | 'rejected');
        toast.success("Application status updated successfully");
      } else {
        // Create new application with the chosen status
        await applyToCampaign(campaignId, influencerId, status as 'pending' | 'approved' | 'rejected');
        toast.success("Application created successfully");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update application status");
    } finally {
      setUpdatingInfluencer(null);
    }
  };

  // Handle phase assignment
  const handlePhaseAssignment = async (influencerId: string, phaseNumber: number) => {
    try {
      setUpdatingInfluencer(influencerId);
      await updateInfluencerVisibility(influencerId, {
        assignedPhase: phaseNumber
      });
      toast.success("Phase assigned successfully");
    } catch (error) {
      console.error('Error assigning phase:', error);
      toast.error("Failed to assign phase");
    } finally {
      setUpdatingInfluencer(null);
    }
  };

  // Handle negotiation toggle
  const handleNegotiationToggle = async (influencerId: string, enabled: boolean) => {
    try {
      setUpdatingInfluencer(influencerId);
      await updateInfluencerVisibility(influencerId, {
        negotiationVisible: enabled
      });
      
      toast.success(enabled 
        ? "Negotiation enabled for this influencer" 
        : "Negotiation disabled for this influencer"
      );
    } catch (error) {
      console.error('Error updating negotiation visibility:', error);
      toast.error("Failed to update negotiation setting");
    } finally {
      setUpdatingInfluencer(null);
    }
  };

  // Handle setting custom budget
  const handleSetCustomBudget = async () => {
    if (!selectedInfluencer || customBudgetAmount <= 0) return;
    
    try {
      setUpdatingInfluencer(selectedInfluencer);
      await updateInfluencerVisibility(selectedInfluencer, {
        customOfferAmount: customBudgetAmount
      });
      
      toast.success("Custom budget set successfully");
      setCustomBudgetDialogOpen(false);
      setSelectedInfluencer(null);
      setCustomBudgetAmount(0);
    } catch (error) {
      console.error('Error setting custom budget:', error);
      toast.error("Failed to set custom budget");
    } finally {
      setUpdatingInfluencer(null);
    }
  };
  
  // Navigate to chat with influencer
  const handleMessage = (influencerId: string) => {
    navigate('/admin/inbox');
    // Ideally we'd navigate directly to the specific conversation
  };

  // Get assigned phase for an influencer
  const getAssignedPhase = (influencerId: string) => {
    const setting = visibilitySettings.find(s => s.influencerId === influencerId);
    return setting?.assignedPhase || null;
  };
  
  if (eligibleInfluencers.length === 0 || (phases.length === 0 && !budgetLoading)) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              {phases.length === 0 && !budgetLoading 
                ? "No budget phases have been created for this campaign yet." 
                : "No eligible influencers found for this campaign."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (budgetLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading budget information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Budget View</TableHead>
                  <TableHead>Negotiation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleInfluencers.map((influencer) => {
                  const hasInfluencerApplied = hasApplied(campaignId, influencer.dbId);
                  const applicationStatus = getApplicationStatus(influencer.dbId);
                  const assignedPhase = getAssignedPhase(influencer.dbId);
                  const currentBudget = getInfluencerBudget(influencer.dbId);
                  const negotiationEnabled = isNegotiationEnabled(influencer.dbId);
                  const customBudgetSet = visibilitySettings.find(
                    s => s.influencerId === influencer.dbId && s.customOfferAmount !== null
                  );
                  
                  return (
                    <TableRow key={influencer.dbId}>
                      <TableCell className="font-medium">{influencer.name}</TableCell>
                      <TableCell>{influencer.instagram || '-'}</TableCell>
                      <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!hasInfluencerApplied && (
                            <Select
                              disabled={updatingInfluencer === influencer.dbId}
                              onValueChange={(value) => handlePhaseAssignment(influencer.dbId, parseInt(value))}
                              defaultValue={assignedPhase?.toString() || ""}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Assign Phase" />
                              </SelectTrigger>
                              <SelectContent>
                                {phases.map((phase) => (
                                  <SelectItem key={phase.id} value={phase.phaseNumber.toString()}>
                                    Phase {phase.phaseNumber}: ₹{phase.budgetAmount.toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <div className="text-nowrap">
                            <span className="font-semibold">₹{currentBudget.toLocaleString()}</span>
                            {customBudgetSet && (
                              <Badge variant="outline" className="ml-1 text-xs">Custom</Badge>
                            )}
                          </div>
                          {!hasInfluencerApplied && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInfluencer(influencer.dbId);
                                setCustomBudgetAmount(currentBudget);
                                setCustomBudgetDialogOpen(true);
                              }}
                              disabled={updatingInfluencer === influencer.dbId}
                              title="Set custom budget"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!hasInfluencerApplied ? (
                          <Switch
                            checked={negotiationEnabled}
                            onCheckedChange={(checked) => handleNegotiationToggle(influencer.dbId, checked)}
                            disabled={updatingInfluencer === influencer.dbId}
                          />
                        ) : (
                          <Badge variant="outline">
                            {applicationStatus === 'pending' ? 'Applied' : 
                             applicationStatus === 'approved' ? 'Approved' : 
                             'Rejected'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasInfluencerApplied ? (
                          <Badge variant={
                            applicationStatus === 'approved' ? 'success' : 
                            applicationStatus === 'rejected' ? 'destructive' : 
                            'default'
                          }>
                            {applicationStatus === 'pending' ? 'Applied' : 
                             applicationStatus === 'approved' ? 'Approved' : 
                             'Rejected'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Eligible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!hasInfluencerApplied && (
                            <Select
                              disabled={updatingInfluencer === influencer.dbId}
                              onValueChange={(value) => handleStatusChange(influencer.dbId, value)}
                              defaultValue={applicationStatus || ""}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Set Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMessage(influencer.dbId)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custom Budget Dialog */}
      <Dialog open={customBudgetDialogOpen} onOpenChange={setCustomBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Custom Budget</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="customBudgetAmount" className="text-sm font-medium">
                  Budget Amount (₹)
                </label>
                <Input
                  id="customBudgetAmount"
                  type="number"
                  value={customBudgetAmount}
                  onChange={(e) => setCustomBudgetAmount(parseFloat(e.target.value))}
                  min="0"
                  step="100"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This will override the phase-based budget for this specific influencer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomBudgetDialogOpen(false);
                setSelectedInfluencer(null);
              }}
              disabled={updatingInfluencer === selectedInfluencer}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSetCustomBudget} 
              disabled={updatingInfluencer === selectedInfluencer}
            >
              {updatingInfluencer === selectedInfluencer ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

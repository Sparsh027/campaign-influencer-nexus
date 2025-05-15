
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, DollarSign } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Campaign } from '@/types/data';
import { toast } from 'sonner';
import { useInfluencerBudget } from '@/hooks/useInfluencerBudget';
import { useNavigate } from 'react-router-dom';

export default function InfluencerCampaigns() {
  const { campaigns, getEligibleCampaigns, isInfluencerEligible, hasApplied, applyToCampaign } = useData();
  const { getCampaignBudget, isNegotiationEnabled, loading: budgetLoading } = useInfluencerBudget();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const navigate = useNavigate();

  const eligibleCampaigns = getEligibleCampaigns();

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns
    .filter(campaign => campaign.status === 'active')
    .filter(campaign =>
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleApply = async (campaignId: string) => {
    setIsApplying(true);
    try {
      const budget = getCampaignBudget(campaignId);
      await applyToCampaign(campaignId, undefined, 'pending', budget, false);
      setSelectedCampaign(null);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error('Apply error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const handleNegotiate = (campaignId: string) => {
    setIsNegotiating(true);
    // Navigate to inbox where they can discuss with admin
    navigate('/influencer/inbox');
    toast.info("Start your negotiation by sending a message to the admin");
    setIsNegotiating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Campaign filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Button 
          variant={searchTerm === '' ? 'default' : 'outline'}
          onClick={() => setSearchTerm('')}
        >
          All Campaigns
        </Button>
        <Button 
          variant={searchTerm === 'eligible' ? 'default' : 'outline'}
          onClick={() => setSearchTerm('eligible')}
        >
          Eligible For Me
        </Button>
      </div>

      {/* Campaigns list */}
      <div className="grid gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => {
            const isEligible = isInfluencerEligible(campaign.id);
            const userHasApplied = hasApplied(campaign.id);
            const campaignBudget = getCampaignBudget(campaign.id);
            const canNegotiate = isNegotiationEnabled(campaign.id);
            
            // If searching for eligible campaigns only
            if (searchTerm === 'eligible' && !isEligible) {
              return null;
            }
            
            return (
              <Card key={campaign.id} className={`overflow-hidden ${!isEligible ? 'opacity-70' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {campaign.title}
                        {userHasApplied && (
                          <Badge variant="outline" className="ml-2">Applied</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created on {new Date(campaign.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm mb-4">{campaign.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min. Followers</p>
                      <p className="font-medium">{campaign.minFollowers.toLocaleString()}</p>
                    </div>
                    
                    {campaign.city && (
                      <div>
                        <p className="text-muted-foreground">City</p>
                        <p className="font-medium">{campaign.city}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium text-brand-600">
                        {!budgetLoading ? (
                          campaignBudget > 0 ? `₹${campaignBudget.toLocaleString()}` : 'Contact for details'
                        ) : (
                          'Loading...'
                        )}
                      </p>
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-muted-foreground mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.categories.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-2">
                    {isEligible && !userHasApplied && canNegotiate && (
                      <Button
                        variant="outline"
                        onClick={() => handleNegotiate(campaign.id)}
                        disabled={isNegotiating}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {isNegotiating ? "Processing..." : "Negotiate"}
                      </Button>
                    )}
                    <Button 
                      variant={userHasApplied ? "outline" : "default"}
                      onClick={() => setSelectedCampaign(campaign)} 
                      disabled={!isEligible || userHasApplied}
                    >
                      {userHasApplied 
                        ? "Applied" 
                        : isEligible 
                          ? "Apply"
                          : "Not Eligible"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No campaigns match your search criteria." : "No active campaigns found."}
            </p>
          </Card>
        )}
      </div>

      {/* Apply dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to Campaign</DialogTitle>
              <DialogDescription>
                You're applying to "{selectedCampaign.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="mb-4">{selectedCampaign.description}</p>
              
              <div className="space-y-4 border-t border-b py-4 my-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum followers:</span>
                  <span>{selectedCampaign.minFollowers.toLocaleString()}</span>
                </div>
                
                {selectedCampaign.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City:</span>
                    <span>{selectedCampaign.city}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-semibold text-brand-600">
                    ₹{getCampaignBudget(selectedCampaign.id).toLocaleString()}
                  </span>
                </div>
                
                <div>
                  <p className="text-muted-foreground mb-1">Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaign.categories.map((category) => (
                      <Badge key={category} variant="outline" className="capitalize">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleApply(selectedCampaign.id)} disabled={isApplying}>
                  {isApplying ? "Applying..." : "Confirm Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

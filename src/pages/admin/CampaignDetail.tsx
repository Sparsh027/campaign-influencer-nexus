
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EligibleInfluencers from '@/components/campaigns/EligibleInfluencers';
import CampaignApplications from '@/components/campaigns/CampaignApplications';
import ApprovedInfluencers from '@/components/campaigns/ApprovedInfluencers';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaigns, applications, getEligibleInfluencers } = useData();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/influencer/dashboard');
    }
  }, [user, navigate]);
  
  // Load campaign data
  useEffect(() => {
    if (campaignId) {
      const foundCampaign = campaigns.find(c => c.id === campaignId);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // Campaign not found
        navigate('/admin/campaigns');
      }
    }
    setLoading(false);
  }, [campaignId, campaigns, navigate]);

  if (loading) return <div className="flex items-center justify-center h-48">Loading...</div>;
  if (!campaign) return null;
  
  // Get counts for tabs
  const eligibleInfluencers = getEligibleInfluencers(campaignId as string);
  const campaignApplications = applications.filter(app => app.campaignId === campaignId);
  const pendingApplications = campaignApplications.filter(app => app.status === 'pending');
  const approvedApplications = campaignApplications.filter(app => app.status === 'approved');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to campaigns
        </Button>
        <h1 className="text-2xl font-bold">{campaign.title}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p>{campaign.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Min Followers</p>
              <p>{campaign.minFollowers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p>{campaign.city || 'Any location'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.categories && campaign.categories.length > 0 ? (
                  campaign.categories.map((category: string) => (
                    <Badge key={category} variant="outline">{category}</Badge>
                  ))
                ) : (
                  <p>Any category</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className="mt-1" variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                {campaign.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="eligible" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="eligible">
            Eligible Influencers 
            <Badge variant="outline" className="ml-2">{eligibleInfluencers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications 
            <Badge variant="outline" className="ml-2">{pendingApplications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved 
            <Badge variant="outline" className="ml-2">{approvedApplications.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="eligible">
          <EligibleInfluencers campaignId={campaignId as string} />
        </TabsContent>
        
        <TabsContent value="applications">
          <CampaignApplications campaignId={campaignId as string} />
        </TabsContent>
        
        <TabsContent value="approved">
          <ApprovedInfluencers campaignId={campaignId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

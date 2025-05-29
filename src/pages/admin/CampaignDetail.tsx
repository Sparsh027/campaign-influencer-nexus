
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import EligibleInfluencers from '@/components/campaigns/EligibleInfluencers';
import CampaignApplications from '@/components/campaigns/CampaignApplications';
import ApprovedInfluencers from '@/components/campaigns/ApprovedInfluencers';
import { Spinner } from '@/components/ui/spinner';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaigns, applications, getEligibleInfluencers } = useData();
  const isMobile = useIsMobile();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('eligible');
  
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }
  
  if (!campaign) return null;
  
  // Get counts for tabs
  const eligibleInfluencers = getEligibleInfluencers(campaignId as string);
  const campaignApplications = applications.filter(app => app.campaignId === campaignId);
  const pendingApplications = campaignApplications.filter(app => app.status === 'pending');
  const approvedApplications = campaignApplications.filter(app => app.status === 'approved');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/campaigns')} className="px-0 sm:px-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to campaigns
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">{campaign.title}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="mt-1">{campaign.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Min Followers</p>
              <p className="mt-1">{campaign.minFollowers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              {Array.isArray(campaign.city) && campaign.city.length > 0 ? (
  <div className="flex flex-wrap gap-1">
    {campaign.city.map((c: string) => (
      <Badge key={c} variant="outline">{c}</Badge>
    ))}
  </div>
) : (
  <p>Any</p>
)}

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
      
      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full sm:w-auto inline-flex">
            <TabsTrigger value="eligible" className="flex-1 sm:flex-initial whitespace-nowrap">
              Eligible Influencers 
              <Badge variant="outline" className="ml-2">{eligibleInfluencers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex-1 sm:flex-initial whitespace-nowrap">
              Applications 
              <Badge variant="outline" className="ml-2">{pendingApplications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 sm:flex-initial whitespace-nowrap">
              Approved 
              <Badge variant="outline" className="ml-2">{approvedApplications.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="eligible" className="mt-4 sm:mt-6">
          <EligibleInfluencers campaignId={campaignId as string} />
        </TabsContent>
        
        <TabsContent value="applications" className="mt-4 sm:mt-6">
          <CampaignApplications campaignId={campaignId as string} />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4 sm:mt-6">
          <ApprovedInfluencers campaignId={campaignId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

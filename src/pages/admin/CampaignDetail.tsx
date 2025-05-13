
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, MapPin, AlertCircle } from 'lucide-react';
import EligibleInfluencers from '@/components/campaigns/EligibleInfluencers';
import CampaignApplications from '@/components/campaigns/CampaignApplications';
import ApprovedInfluencers from '@/components/campaigns/ApprovedInfluencers';
import { useIsMobile } from '@/hooks/use-mobile';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaigns, applications, getEligibleInfluencers } = useData();
  const isMobile = useIsMobile();
  
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
  
  if (!campaign) return null;
  
  // Get counts for tabs
  const eligibleInfluencers = getEligibleInfluencers(campaignId as string);
  const campaignApplications = applications.filter(app => app.campaignId === campaignId);
  const pendingApplications = campaignApplications.filter(app => app.status === 'pending');
  const approvedApplications = campaignApplications.filter(app => app.status === 'approved');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/campaigns')} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold truncate">{campaign.title}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <CardTitle>Campaign Details</CardTitle>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
          </div>
          <CardDescription className="line-clamp-3">{campaign.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm font-medium">Min Followers: {campaign.minFollowers.toLocaleString()}</p>
            </div>
            
            {campaign.city && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-sm font-medium">Location: {campaign.city}</p>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm font-medium">Created: {new Date(campaign.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Categories:</p>
            <div className="flex flex-wrap gap-1">
              {campaign.categories && campaign.categories.length > 0 ? (
                campaign.categories.map((category: string) => (
                  <Badge key={category} variant="outline">{category}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Any category</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="eligible" className="w-full">
        <TabsList className={`${isMobile ? 'w-full grid grid-cols-3' : 'w-auto'}`}>
          <TabsTrigger value="eligible" className="flex items-center gap-1.5">
            Eligible
            <Badge variant="outline" className="ml-1">{eligibleInfluencers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-1.5">
            Applications
            <Badge variant="outline" className="ml-1">{pendingApplications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-1.5">
            Approved
            <Badge variant="outline" className="ml-1">{approvedApplications.length}</Badge>
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

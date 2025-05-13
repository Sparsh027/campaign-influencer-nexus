
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Check, MessageSquare, User, X } from 'lucide-react';
import { Campaign, Application } from '@/types/data';
import { InfluencerUser, User } from '@/types/auth';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Type guard to check if a user is an InfluencerUser
const isInfluencerUser = (user: User): user is InfluencerUser => {
  return user.role === 'influencer';
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, applications, getEligibleInfluencers, updateCampaign } = useData();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [eligibleInfluencers, setEligibleInfluencers] = useState<InfluencerUser[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState('eligible');
  const [viewingInfluencer, setViewingInfluencer] = useState<InfluencerUser | null>(null);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);

  // Load campaign data
  useEffect(() => {
    if (!id) return;

    const foundCampaign = campaigns.find(c => c.id === id);
    if (!foundCampaign) {
      toast.error('Campaign not found');
      navigate('/admin/campaigns');
      return;
    }

    setCampaign(foundCampaign);
  }, [id, campaigns, navigate]);

  // Load applications and eligible influencers
  useEffect(() => {
    if (!campaign) return;

    // Get all eligible influencers
    const eligible = getEligibleInfluencers(campaign.id);
    setEligibleInfluencers(eligible);

    // Filter applications for this campaign
    const campaignApplications = applications.filter(app => app.campaignId === campaign.id);
    
    // Group applications by status
    setPendingApplications(campaignApplications.filter(app => app.status === 'pending'));
    setApprovedApplications(campaignApplications.filter(app => app.status === 'approved'));
    setRejectedApplications(campaignApplications.filter(app => app.status === 'rejected'));

  }, [campaign, applications, getEligibleInfluencers]);

  // Handle application approval/rejection
  const handleUpdateApplicationStatus = async (application: Application, newStatus: 'approved' | 'rejected') => {
    try {
      // In a real app, you'd make an API call here
      // For now, we'll assume the DataContext's updateCampaign will handle this
      // This is a placeholder - you'll need to add this function to your DataContext
      await updateApplicationStatus(application.id, newStatus);
      
      toast.success(`Application ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);

      // Update our local state to reflect the change
      if (newStatus === 'approved') {
        setPendingApplications(prev => prev.filter(app => app.id !== application.id));
        setApprovedApplications(prev => [...prev, { ...application, status: newStatus }]);
      } else {
        setPendingApplications(prev => prev.filter(app => app.id !== application.id));
        setRejectedApplications(prev => [...prev, { ...application, status: newStatus }]);
      }

      // Close the viewing dialog if open
      if (viewingApplication?.id === application.id) {
        setViewingApplication(null);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  // This is a placeholder - in a real app, implement this in DataContext
  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    // This would be replaced with a proper API call
    return new Promise((resolve) => setTimeout(resolve, 500));
  };
  
  // Handle initiating a message
  const handleMessageInfluencer = (influencer: InfluencerUser) => {
    // Navigate to the inbox with this influencer selected
    navigate(`/admin/inbox?influencerId=${influencer.dbId}`);
  };

  if (!campaign) {
    return <div className="p-6">Loading campaign details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and campaign title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/campaigns')} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{campaign.title}</h1>
      </div>

      {/* Campaign summary card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="capitalize">{campaign.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">City</h3>
              <p>{campaign.city || 'Any'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Min. Followers</h3>
              <p>{campaign.minFollowers.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{new Date(campaign.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {campaign.categories.map(cat => (
                <Badge key={cat} variant="outline" className="capitalize">{cat}</Badge>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="mt-1 text-sm text-gray-600">{campaign.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Eligible, Applications, and Approved */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="eligible">
            Eligible ({eligibleInfluencers.length})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApplications.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Eligible Influencers Tab */}
        <TabsContent value="eligible" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligibleInfluencers.length > 0 ? (
                    eligibleInfluencers.map(influencer => (
                      <TableRow key={influencer.id}>
                        <TableCell className="font-medium">{influencer.name}</TableCell>
                        <TableCell>{influencer.instagram || '-'}</TableCell>
                        <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                        <TableCell>
                          {influencer.categories?.map(cat => (
                            <Badge key={cat} variant="outline" className="mr-1 capitalize">{cat}</Badge>
                          ))}
                        </TableCell>
                        <TableCell>{influencer.city || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewingInfluencer(influencer)}
                          >
                            <User className="h-4 w-4 mr-1" /> View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No eligible influencers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApplications.length > 0 ? (
                    pendingApplications.map(application => {
                      const influencer = application.influencer;
                      if (!influencer || !isInfluencerUser(influencer)) return null;
                      
                      return (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">{influencer.name}</TableCell>
                          <TableCell>{influencer.instagram || '-'}</TableCell>
                          <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                          <TableCell>{format(new Date(application.createdAt), 'PPP')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setViewingApplication(application);
                                  setViewingInfluencer(influencer);
                                }}
                              >
                                <User className="h-4 w-4 mr-1" /> View
                              </Button>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleUpdateApplicationStatus(application, 'approved')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => handleUpdateApplicationStatus(application, 'rejected')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No pending applications
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Approved Influencers Tab */}
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Approved on</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedApplications.length > 0 ? (
                    approvedApplications.map(application => {
                      const influencer = application.influencer;
                      if (!influencer || !isInfluencerUser(influencer)) return null;
                      
                      return (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">{influencer.name}</TableCell>
                          <TableCell>{influencer.instagram || '-'}</TableCell>
                          <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                          <TableCell>{format(new Date(application.createdAt), 'PPP')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setViewingApplication(application);
                                  setViewingInfluencer(influencer);
                                }}
                              >
                                <User className="h-4 w-4 mr-1" /> View Profile
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMessageInfluencer(influencer)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" /> Message
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No approved applications
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Influencer Profile Dialog */}
      <Dialog open={!!viewingInfluencer} onOpenChange={(open) => !open && setViewingInfluencer(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Influencer Profile</DialogTitle>
            <DialogDescription>
              Detailed information about this influencer
            </DialogDescription>
          </DialogHeader>
          
          {viewingInfluencer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar>
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white text-lg font-medium">
                    {viewingInfluencer.name.charAt(0).toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{viewingInfluencer.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewingInfluencer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Instagram</h4>
                  <p>{viewingInfluencer.instagram || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p>{viewingInfluencer.phone || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Followers</h4>
                  <p>{viewingInfluencer.followerCount?.toLocaleString() || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">City</h4>
                  <p>{viewingInfluencer.city || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Categories</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewingInfluencer.categories?.length ? (
                    viewingInfluencer.categories.map(cat => (
                      <Badge key={cat} variant="outline" className="capitalize">{cat}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No categories specified</p>
                  )}
                </div>
              </div>

              {/* If we're viewing as part of an application, show application details */}
              {viewingApplication && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Application Status</h4>
                  <div className="mt-1">
                    <Badge className={
                      viewingApplication.status === 'approved' 
                        ? "bg-green-50 text-green-700 border-green-200"
                        : viewingApplication.status === 'rejected'
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }>
                      {viewingApplication.status.charAt(0).toUpperCase() + viewingApplication.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted on {format(new Date(viewingApplication.createdAt), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center">
            {viewingApplication && viewingApplication.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => handleUpdateApplicationStatus(viewingApplication, 'rejected')}
                >
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button 
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                  onClick={() => handleUpdateApplicationStatus(viewingApplication, 'approved')}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              </div>
            )}
            {viewingInfluencer && (
              <Button 
                variant="outline"
                onClick={() => handleMessageInfluencer(viewingInfluencer)}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Message
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => {
                setViewingInfluencer(null);
                setViewingApplication(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

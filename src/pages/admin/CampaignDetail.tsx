
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useData } from '@/contexts/DataContext';
import { Campaign, Application } from '@/types/data';
import { InfluencerUser } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MessageSquare, Calendar, User, ChevronLeft, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    campaigns, 
    getEligibleInfluencers, 
    getApplicationsForCampaign,
    getApprovedInfluencersForCampaign, 
    updateApplicationStatus,
    createMessage
  } = useData();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [eligibleInfluencers, setEligibleInfluencers] = useState<InfluencerUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [approvedInfluencers, setApprovedInfluencers] = useState<Application[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerUser | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState("eligible");
  
  // Find campaign by ID
  useEffect(() => {
    if (id && campaigns.length > 0) {
      const foundCampaign = campaigns.find(c => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      }
    }
  }, [id, campaigns]);
  
  // Load eligible influencers
  useEffect(() => {
    if (campaign) {
      const eligible = getEligibleInfluencers(campaign.id);
      setEligibleInfluencers(eligible);
      
      const appList = getApplicationsForCampaign(campaign.id);
      setApplications(appList.filter(app => app.status === 'pending'));
      
      const approved = getApplicationsForCampaign(campaign.id).filter(app => app.status === 'approved');
      setApprovedInfluencers(approved);
    }
  }, [campaign, getEligibleInfluencers, getApplicationsForCampaign]);
  
  // Handle application status change
  const handleUpdateStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      
      // Refresh lists after status change
      if (campaign) {
        const appList = getApplicationsForCampaign(campaign.id);
        setApplications(appList.filter(app => app.status === 'pending'));
        
        const approved = getApplicationsForCampaign(campaign.id).filter(app => app.status === 'approved');
        setApprovedInfluencers(approved);
      }
      
      toast.success(`Application ${newStatus}`);
      setIsApplicationDialogOpen(false);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };
  
  // Handle sending a message to an influencer
  const handleSendMessage = async () => {
    if (!selectedInfluencer || !messageContent.trim()) return;
    
    try {
      await createMessage({
        receiverId: selectedInfluencer.id,
        receiverType: 'influencer',
        content: messageContent
      });
      
      toast.success('Message sent successfully');
      setMessageContent('');
      setIsMessageDialogOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  // Pagination logic
  const paginateData = (items: any[]) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPagesEligible = Math.ceil(eligibleInfluencers.length / itemsPerPage);
  const totalPagesApplications = Math.ceil(applications.length / itemsPerPage);
  const totalPagesApproved = Math.ceil(approvedInfluencers.length / itemsPerPage);
  
  if (!campaign) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading campaign details...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/admin/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Campaigns
          </Link>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
          <p className="text-muted-foreground mt-2">{campaign.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {campaign.categories.map(category => (
            <Badge key={category} variant="outline" className="capitalize">
              {category}
            </Badge>
          ))}
          <Badge variant="outline" className="ml-auto">
            {campaign.minFollowers.toLocaleString()} min. followers
          </Badge>
          <Badge variant="outline">
            {campaign.city}
          </Badge>
        </div>
        
        <Tabs defaultValue="eligible" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="eligible">
              Eligible Influencers 
              <Badge variant="secondary" className="ml-2">{eligibleInfluencers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="applications">
              Applications 
              <Badge variant="secondary" className="ml-2">{applications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved 
              <Badge variant="secondary" className="ml-2">{approvedInfluencers.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Eligible Influencers Tab */}
          <TabsContent value="eligible" className="space-y-4">
            {eligibleInfluencers.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Eligible Influencers</CardTitle>
                    <CardDescription>
                      These influencers meet the criteria for this campaign.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Instagram</TableHead>
                          <TableHead>Followers</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginateData(eligibleInfluencers).map((influencer) => (
                          <TableRow key={influencer.id}>
                            <TableCell>{influencer.name}</TableCell>
                            <TableCell>{influencer.instagram}</TableCell>
                            <TableCell>{influencer.followerCount?.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {influencer.categories?.slice(0, 2).map((cat, idx) => (
                                  <Badge key={idx} variant="outline" className="capitalize">
                                    {cat}
                                  </Badge>
                                ))}
                                {(influencer.categories?.length || 0) > 2 && (
                                  <Badge variant="outline">+{(influencer.categories?.length || 0) - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{influencer.city || 'N/A'}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedInfluencer(influencer);
                                  setIsProfileDialogOpen(true);
                                }}
                              >
                                View Profile
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    {totalPagesEligible > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPagesEligible }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPagesEligible, p + 1))}
                              className={currentPage === totalPagesEligible ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </CardFooter>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <User className="h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-xl font-medium">No eligible influencers found</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    There are no influencers that match the criteria for this campaign.
                    <br />Try adjusting your campaign requirements to reach more influencers.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Applications</CardTitle>
                    <CardDescription>
                      Review and process influencer applications for this campaign.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Influencer</TableHead>
                          <TableHead>Instagram</TableHead>
                          <TableHead>Followers</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginateData(applications).map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>{application.influencer?.name || 'Unknown'}</TableCell>
                            <TableCell>{application.influencer?.instagram || 'N/A'}</TableCell>
                            <TableCell>{application.influencer?.followerCount?.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell>
                              {format(new Date(application.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Pending</Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setSelectedInfluencer(application.influencer);
                                  setIsApplicationDialogOpen(true);
                                }}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    {totalPagesApplications > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPagesApplications }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPagesApplications, p + 1))}
                              className={currentPage === totalPagesApplications ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </CardFooter>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Calendar className="h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-xl font-medium">No pending applications</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    There are no pending applications for this campaign.
                    <br />Applications will appear here once influencers apply.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {approvedInfluencers.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Approved Influencers</CardTitle>
                    <CardDescription>
                      These influencers have been approved to work on this campaign.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Influencer</TableHead>
                          <TableHead>Instagram</TableHead>
                          <TableHead>Followers</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginateData(approvedInfluencers).map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>{application.influencer?.name || 'Unknown'}</TableCell>
                            <TableCell>{application.influencer?.instagram || 'N/A'}</TableCell>
                            <TableCell>{application.influencer?.followerCount?.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell>
                              {format(new Date(application.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedInfluencer(application.influencer);
                                    setIsProfileDialogOpen(true);
                                  }}
                                >
                                  View Profile
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedInfluencer(application.influencer);
                                    setIsMessageDialogOpen(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    {totalPagesApproved > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPagesApproved }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPagesApproved, p + 1))}
                              className={currentPage === totalPagesApproved ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </CardFooter>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Check className="h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-xl font-medium">No approved influencers</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    There are no approved influencers for this campaign yet.
                    <br />Once you approve applications, they will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Influencer Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Influencer Profile</DialogTitle>
              <DialogDescription>
                Detailed information about this influencer.
              </DialogDescription>
            </DialogHeader>
            
            {selectedInfluencer && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <div className="bg-muted rounded-full flex items-center justify-center h-full w-full">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{selectedInfluencer.name}</h3>
                    <p className="text-muted-foreground">@{selectedInfluencer.instagram}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Followers</p>
                    <p className="font-medium">{selectedInfluencer.followerCount?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedInfluencer.city || 'Not specified'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm text-muted-foreground mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfluencer.categories?.map((category, idx) => (
                      <Badge key={idx} variant="outline" className="capitalize">
                        {category}
                      </Badge>
                    )) || <p className="text-sm">No categories specified</p>}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      setIsMessageDialogOpen(true);
                      setIsProfileDialogOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Application Review Dialog */}
        <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
              <DialogDescription>
                Review and process this campaign application.
              </DialogDescription>
            </DialogHeader>
            
            {selectedApplication && selectedInfluencer && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <div className="bg-muted rounded-full flex items-center justify-center h-full w-full">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{selectedInfluencer.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <p>@{selectedInfluencer.instagram}</p>
                      <span>•</span>
                      <p>{selectedInfluencer.followerCount?.toLocaleString() || 'N/A'} followers</p>
                    </div>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Application Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Submitted Date</p>
                        <p className="font-medium">
                          {format(new Date(selectedApplication.createdAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="secondary">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Influencer Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedInfluencer.city || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Followers</p>
                          <p className="font-medium">
                            {selectedInfluencer.followerCount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground mb-1">Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedInfluencer.categories?.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="capitalize">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
                  <Button 
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                  
                  <Button 
                    onClick={() => handleUpdateStatus(selectedApplication.id, 'approved')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedInfluencer?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <div className="bg-muted rounded-full flex items-center justify-center h-full w-full">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedInfluencer?.name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedInfluencer?.instagram}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Type your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsMessageDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

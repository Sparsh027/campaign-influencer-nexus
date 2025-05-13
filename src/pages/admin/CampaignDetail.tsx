
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useData } from "@/contexts/DataContext";
import { Campaign, Application } from "@/types/data";
import { InfluencerUser } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  MessageCircle,
  Check,
  X,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    campaigns, 
    influencers, 
    applications, 
    getEligibleInfluencers,
    isInfluencerEligible,
    updateApplication
  } = useData();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [eligibleInfluencers, setEligibleInfluencers] = useState<InfluencerUser[]>([]);
  const [campaignApplications, setCampaignApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState("eligible");
  const [viewInfluencer, setViewInfluencer] = useState<InfluencerUser | null>(null);

  // Format categories for display
  const formatCategories = (categories: string[]) => {
    return categories.slice(0, 2).join(", ") + 
      (categories.length > 2 ? ` +${categories.length - 2}` : "");
  };

  // Get application status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  // Handle approve application
  const handleApprove = async (applicationId: string) => {
    try {
      await updateApplication(applicationId, "approved");
      toast.success("Application approved successfully");
      
      // Refresh applications
      const updatedApplications = applications.map(app => 
        app.id === applicationId 
          ? { ...app, status: "approved" as const } 
          : app
      );
      setCampaignApplications(updatedApplications.filter(app => app.campaignId === id));
    } catch (error) {
      toast.error("Failed to approve application");
      console.error(error);
    }
  };

  // Handle reject application
  const handleReject = async (applicationId: string) => {
    try {
      await updateApplication(applicationId, "rejected");
      toast.success("Application rejected successfully");
      
      // Refresh applications
      const updatedApplications = applications.map(app => 
        app.id === applicationId 
          ? { ...app, status: "rejected" as const } 
          : app
      );
      setCampaignApplications(updatedApplications.filter(app => app.campaignId === id));
    } catch (error) {
      toast.error("Failed to reject application");
      console.error(error);
    }
  };

  // Handle message influencer
  const handleMessageInfluencer = (influencerId: string) => {
    navigate(`/admin/inbox?contact=${influencerId}`);
  };

  // Initialize data
  useEffect(() => {
    if (id && campaigns.length > 0) {
      const foundCampaign = campaigns.find(c => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
        
        // Get eligible influencers
        const eligible = getEligibleInfluencers(id);
        setEligibleInfluencers(eligible);
        
        // Get campaign applications
        const campaignApps = applications.filter(app => app.campaignId === id);
        setCampaignApplications(campaignApps);
      }
    }
  }, [id, campaigns, influencers, applications]);

  // Calculate counts
  const eligibleCount = eligibleInfluencers.length;
  const pendingCount = campaignApplications.filter(app => app.status === "pending").length;
  const approvedCount = campaignApplications.filter(app => app.status === "approved").length;
  
  if (!campaign) {
    return (
      <AdminLayout>
        <div className="p-4">Loading campaign...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/campaigns')}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge>Min followers: {campaign.minFollowers}</Badge>
            {campaign.city && <Badge>{campaign.city}</Badge>}
            {campaign.categories.map(cat => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="eligible" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="eligible">
              Eligible Influencers ({eligibleCount})
            </TabsTrigger>
            <TabsTrigger value="applications">
              Applications ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Influencers ({approvedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eligible">
            <Card>
              <CardHeader>
                <CardTitle>Eligible Influencers</CardTitle>
                <CardDescription>
                  Influencers who match this campaign's requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
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
                      {eligibleInfluencers.map((influencer) => (
                        <TableRow key={influencer.dbId}>
                          <TableCell>{influencer.name}</TableCell>
                          <TableCell>{influencer.instagram || "N/A"}</TableCell>
                          <TableCell>{influencer.followerCount?.toLocaleString() || "N/A"}</TableCell>
                          <TableCell>
                            {influencer.categories?.length 
                              ? formatCategories(influencer.categories)
                              : "N/A"}
                          </TableCell>
                          <TableCell>{influencer.city || "N/A"}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setViewInfluencer(influencer)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Profile
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Influencer Profile</DialogTitle>
                                </DialogHeader>
                                {viewInfluencer && (
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="font-medium">Name</h3>
                                      <p>{viewInfluencer.name}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Email</h3>
                                      <p>{viewInfluencer.email}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Instagram</h3>
                                      <p>{viewInfluencer.instagram || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Followers</h3>
                                      <p>{viewInfluencer.followerCount?.toLocaleString() || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Phone</h3>
                                      <p>{viewInfluencer.phone || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Categories</h3>
                                      <p>
                                        {viewInfluencer.categories?.join(", ") || "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">City</h3>
                                      <p>{viewInfluencer.city || "Not provided"}</p>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button 
                                    onClick={() => viewInfluencer && handleMessageInfluencer(viewInfluencer.dbId)}
                                  >
                                    <MessageCircle className="mr-2 h-4 w-4" /> Message
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {eligibleInfluencers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            No eligible influencers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Review and manage influencer applications for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Instagram</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignApplications.map((application) => {
                        // Find influencer data
                        const influencer = influencers.find(i => i.dbId === application.influencerId);
                        if (!influencer) return null;

                        return (
                          <TableRow key={application.id}>
                            <TableCell>{influencer.name}</TableCell>
                            <TableCell>{influencer.instagram || "N/A"}</TableCell>
                            <TableCell>
                              {format(new Date(application.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(application.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setViewInfluencer(influencer)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" /> View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Application Details</DialogTitle>
                                      <DialogDescription>
                                        Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
                                      </DialogDescription>
                                    </DialogHeader>
                                    {viewInfluencer && (
                                      <div className="space-y-4">
                                        <div>
                                          <h3 className="font-medium">Name</h3>
                                          <p>{viewInfluencer.name}</p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Email</h3>
                                          <p>{viewInfluencer.email}</p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Instagram</h3>
                                          <p>{viewInfluencer.instagram || "Not provided"}</p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Followers</h3>
                                          <p>{viewInfluencer.followerCount?.toLocaleString() || "Not provided"}</p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Categories</h3>
                                          <p>
                                            {viewInfluencer.categories?.join(", ") || "Not provided"}
                                          </p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">City</h3>
                                          <p>{viewInfluencer.city || "Not provided"}</p>
                                        </div>
                                        <div>
                                          <h3 className="font-medium">Status</h3>
                                          <p>{getStatusBadge(application.status)}</p>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter className="flex justify-between">
                                      {application.status === "pending" && (
                                        <div className="flex space-x-2">
                                          <DialogClose asChild>
                                            <Button 
                                              variant="outline"
                                              onClick={() => handleReject(application.id)}
                                            >
                                              <X className="mr-2 h-4 w-4" /> Reject
                                            </Button>
                                          </DialogClose>
                                          <DialogClose asChild>
                                            <Button 
                                              onClick={() => handleApprove(application.id)}
                                            >
                                              <Check className="mr-2 h-4 w-4" /> Approve
                                            </Button>
                                          </DialogClose>
                                        </div>
                                      )}
                                      <Button 
                                        variant="secondary"
                                        onClick={() => viewInfluencer && handleMessageInfluencer(viewInfluencer.dbId)}
                                      >
                                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                {application.status === "pending" && (
                                  <>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReject(application.id)}
                                    >
                                      <X className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleApprove(application.id)}
                                    >
                                      <Check className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {campaignApplications.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No applications received yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Influencers</CardTitle>
                <CardDescription>
                  Influencers who have been approved for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {campaignApplications
                    .filter(app => app.status === "approved")
                    .map((application) => {
                      // Find influencer data
                      const influencer = influencers.find(i => i.dbId === application.influencerId);
                      if (!influencer) return null;

                      return (
                        <Card key={application.id} className="mb-4">
                          <CardHeader>
                            <CardTitle>{influencer.name}</CardTitle>
                            <CardDescription>
                              {influencer.instagram || "No Instagram"} • {influencer.followerCount?.toLocaleString() || "Unknown"} followers
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {influencer.categories?.map(cat => (
                                  <Badge key={cat} variant="secondary">{cat}</Badge>
                                ))}
                              </div>
                              <p>
                                <span className="font-medium">City:</span> {influencer.city || "Not specified"}
                              </p>
                              <p>
                                <span className="font-medium">Email:</span> {influencer.email}
                              </p>
                              <p>
                                <span className="font-medium">Phone:</span> {influencer.phone || "Not provided"}
                              </p>
                              <p>
                                <span className="font-medium">Approved on:</span> {format(new Date(application.createdAt), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button 
                              variant="outline"
                              onClick={() => handleReject(application.id)}
                            >
                              Revoke Approval
                            </Button>
                            <Button 
                              onClick={() => handleMessageInfluencer(influencer.dbId)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" /> Message
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  {campaignApplications.filter(app => app.status === "approved").length === 0 && (
                    <div className="text-center py-8">
                      No approved influencers yet
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

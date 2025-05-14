
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface EligibleInfluencersProps {
  campaignId: string;
}

export default function EligibleInfluencers({ campaignId }: EligibleInfluencersProps) {
  const { 
    getEligibleInfluencers, 
    hasApplied, 
    applications, 
    updateApplicationStatus, 
    applyToCampaign 
  } = useData();
  const navigate = useNavigate();
  
  const [updatingInfluencer, setUpdatingInfluencer] = useState<string | null>(null);
  
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
        toast({
          title: "Success",
          description: "Application status updated successfully",
        });
      } else {
        // Create new application with the chosen status
        await applyToCampaign(campaignId, influencerId, status as 'pending' | 'approved' | 'rejected');
        toast({
          title: "Success",
          description: "Application created successfully",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setUpdatingInfluencer(null);
    }
  };
  
  // Navigate to chat with influencer
  const handleMessage = (influencerId: string) => {
    navigate('/admin/inbox');
    // Ideally we'd navigate directly to the specific conversation
    // This would require additional work in the inbox component
  };
  
  if (eligibleInfluencers.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">No eligible influencers found for this campaign.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibleInfluencers.map((influencer) => {
                const hasInfluencerApplied = hasApplied(campaignId, influencer.dbId);
                const applicationStatus = getApplicationStatus(influencer.dbId);
                
                return (
                  <TableRow key={influencer.dbId}>
                    <TableCell className="font-medium">{influencer.name}</TableCell>
                    <TableCell>{influencer.instagram || '-'}</TableCell>
                    <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {influencer.categories?.map((category) => (
                          <Badge key={category} variant="outline">{category}</Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{influencer.city || '-'}</TableCell>
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
  );
}

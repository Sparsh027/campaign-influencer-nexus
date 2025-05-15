
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { InfluencerUser } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CampaignApplicationsProps {
  campaignId: string;
}

export default function CampaignApplications({ campaignId }: CampaignApplicationsProps) {
  const { applications, influencers, updateApplicationStatus } = useData();
  const navigate = useNavigate();
  
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null);
  
  const pendingApplications = applications.filter(app => 
    app.campaignId === campaignId && app.status === 'pending'
  );
  
  const getInfluencer = (influencerId: string): InfluencerUser | undefined => {
    return influencers.find(inf => inf.dbId === influencerId);
  };
  
  if (pendingApplications.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">No pending applications for this campaign.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle application status update
  const handleUpdateStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingApplication(applicationId);
      await updateApplicationStatus(applicationId, status);
      toast({
        title: "Success",
        description: `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setUpdatingApplication(null);
    }
  };
  
  // Handle message
  const handleMessage = (influencerId: string) => {
    navigate('/admin/inbox');
    // Ideally we'd navigate to the specific conversation
  };
  
  // Format date safely
  const safeFormat = (dateString: string, formatStr: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplications.map((application) => {
                const influencer = getInfluencer(application.influencerId);
                return (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{influencer?.name || 'Unknown'}</TableCell>
                    <TableCell>{influencer?.instagram || '-'}</TableCell>
                    <TableCell>{influencer?.followerCount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      {application.budgetAppliedFor 
                        ? `₹${application.budgetAppliedFor.toLocaleString()}`
                        : '-'
                      }
                      {application.isNegotiated && (
                        <Badge variant="outline" className="ml-2">Negotiated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {safeFormat(application.createdAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {influencer?.categories?.map((category) => (
                          <Badge key={category} variant="outline">{category}</Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          disabled={updatingApplication === application.id}
                          onValueChange={(value) => handleUpdateStatus(application.id, value as 'approved' | 'rejected')}
                          defaultValue={application.status}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Status" />
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
                          onClick={() => handleMessage(application.influencerId)}
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

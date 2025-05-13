
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { InfluencerUser } from '@/types/auth';

interface CampaignApplicationsProps {
  campaignId: string;
}

export default function CampaignApplications({ campaignId }: CampaignApplicationsProps) {
  const { applications, influencers, updateApplicationStatus } = useData();
  
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
  
  // Handle application approval/rejection
  const handleUpdateStatus = (applicationId: string, status: 'approved' | 'rejected') => {
    updateApplicationStatus(applicationId, status);
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
                <TableHead>Categories</TableHead>
                <TableHead>Applied On</TableHead>
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
                      <div className="flex flex-wrap gap-1">
                        {influencer?.categories?.map((category) => (
                          <Badge key={category} variant="outline">{category}</Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(application.id, 'approved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(application.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
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

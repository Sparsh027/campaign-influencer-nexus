
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { InfluencerUser } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

interface ApprovedInfluencersProps {
  campaignId: string;
}

export default function ApprovedInfluencers({ campaignId }: ApprovedInfluencersProps) {
  const { applications, influencers } = useData();
  const navigate = useNavigate();
  
  const approvedApplications = applications.filter(app => 
    app.campaignId === campaignId && app.status === 'approved'
  );
  
  const getInfluencer = (influencerId: string): InfluencerUser | undefined => {
    return influencers.find(inf => inf.dbId === influencerId);
  };
  
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
  
  if (approvedApplications.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">No approved influencers for this campaign yet.</p>
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
                <TableHead>Influencer</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Approved On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedApplications.map((application) => {
                const influencer = getInfluencer(application.influencerId);
                return (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{influencer?.name || 'Unknown'}</TableCell>
                    <TableCell>{influencer?.instagram || '-'}</TableCell>
                    <TableCell>{influencer?.followerCount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      {application.finalOfferAmount || application.budgetAppliedFor 
                        ? `₹${(application.finalOfferAmount || application.budgetAppliedFor || 0).toLocaleString()}`
                        : '-'
                      }
                      {application.isNegotiated && (
                        <Badge variant="outline" className="ml-2">Negotiated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {influencer?.categories?.map((category) => (
                          <Badge key={category} variant="outline">{category}</Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {safeFormat(application.createdAt, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMessage(application.influencerId)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
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


import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InfluencerApplications() {
  const { applications, campaigns } = useData();
  const navigate = useNavigate();
  
  // Helper to get campaign by ID
  const getCampaign = (campaignId: string) => {
    return campaigns.find(campaign => campaign.id === campaignId);
  };
  
  // Handle messaging admin about a specific campaign
  const handleMessageAdmin = (campaignId: string) => {
    // Navigate to inbox with context about the campaign
    navigate(`/influencer/inbox`);
  };
  
  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">
              You haven't applied to any campaigns yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
  
  // Get approved applications
  const approvedApplications = applications.filter(app => app.status === 'approved');
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
      
      {approvedApplications.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approved Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Approved On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedApplications.map((application) => {
                  const campaign = getCampaign(application.campaignId);
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {campaign ? campaign.title : 'Unknown Campaign'}
                      </TableCell>
                      <TableCell>
                        {application.budgetAppliedFor ? (
                          <span>₹{application.budgetAppliedFor.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                        {application.isNegotiated && (
                          <Badge variant="outline" className="ml-2">Negotiated</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {safeFormat(application.createdAt, 'PP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessageAdmin(application.campaignId)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {pendingApplications.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((application) => {
                  const campaign = getCampaign(application.campaignId);
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {campaign ? campaign.title : 'Unknown Campaign'}
                      </TableCell>
                      <TableCell>
                        {application.budgetAppliedFor ? (
                          <span>₹{application.budgetAppliedFor.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                        {application.isNegotiated && (
                          <Badge variant="outline" className="ml-2">Negotiated</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {safeFormat(application.createdAt, 'PP')}
                      </TableCell>
                      <TableCell>
                        <Badge>Pending Approval</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {rejectedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejected Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedApplications.map((application) => {
                  const campaign = getCampaign(application.campaignId);
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {campaign ? campaign.title : 'Unknown Campaign'}
                      </TableCell>
                      <TableCell>
                        {application.budgetAppliedFor ? (
                          <span>₹{application.budgetAppliedFor.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                        {application.isNegotiated && (
                          <Badge variant="outline" className="ml-2">Negotiated</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {safeFormat(application.createdAt, 'PP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">Rejected</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

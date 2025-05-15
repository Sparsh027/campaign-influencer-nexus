
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function InfluencerApplications() {
  const { applications, campaigns } = useData();
  
  // Helper to get campaign by ID
  const getCampaign = (campaignId: string) => {
    return campaigns.find(campaign => campaign.id === campaignId);
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
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
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
              {applications.map((application) => {
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
                      <Badge variant={
                        application.status === 'approved' ? 'success' : 
                        application.status === 'rejected' ? 'destructive' : 
                        'default'
                      }>
                        {application.status === 'pending' ? 'Pending Approval' : 
                         application.status === 'approved' ? 'Approved' : 
                         'Rejected'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

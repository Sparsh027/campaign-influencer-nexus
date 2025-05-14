
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminApplications() {
  const { applications, campaigns, influencers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort applications by date (newest first)
  const sortedApplications = [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Filter applications
  const filteredApplications = sortedApplications.filter(application => {
    const campaign = campaigns.find(c => c.id === application.campaignId);
    const influencer = influencers.find(i => i.dbId === application.influencerId);
    
    if (!campaign || !influencer) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      campaign.title.toLowerCase().includes(searchLower) ||
      influencer.name.toLowerCase().includes(searchLower) ||
      application.status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Applications</h1>
      </div>
      
      <div className="flex items-center w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            Review all campaign applications from influencers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => {
                    const campaign = campaigns.find(c => c.id === application.campaignId);
                    const influencer = influencers.find(i => i.dbId === application.influencerId);
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {influencer?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {campaign?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(application.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              application.status === 'approved' ? 'default' :
                              application.status === 'rejected' ? 'destructive' : 'outline'
                            }
                          >
                            {application.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/campaign/${application.campaignId}?tab=applications&highlight=${application.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

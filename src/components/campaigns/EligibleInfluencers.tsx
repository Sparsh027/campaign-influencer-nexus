
import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface EligibleInfluencersProps {
  campaignId: string;
}

export default function EligibleInfluencers({ campaignId }: EligibleInfluencersProps) {
  const { getEligibleInfluencers, hasApplied } = useData();
  
  const eligibleInfluencers = getEligibleInfluencers(campaignId);
  
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
              {eligibleInfluencers.map((influencer) => (
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
                    {hasApplied(campaignId, influencer.dbId) ? (
                      <Badge>Applied</Badge>
                    ) : (
                      <Badge variant="outline">Eligible</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

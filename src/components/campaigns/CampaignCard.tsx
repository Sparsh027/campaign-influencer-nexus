
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/types/data';

interface CampaignCardProps {
  campaign: Campaign;
  onApply?: (id: string) => void;
  hasApplied?: boolean;
  isAdmin?: boolean;
}

export function CampaignCard({ campaign, onApply, hasApplied, isAdmin = false }: CampaignCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{campaign.title}</CardTitle>
          <Badge 
            variant={campaign.status === 'active' ? 'success' : campaign.status === 'draft' ? 'outline' : 'secondary'}
          >
            {campaign.status}
          </Badge>
        </div>
        <CardDescription>Minimum followers: {campaign.minFollowers?.toLocaleString() || 'Not specified'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{campaign.description}</p>
        
        <div className="space-y-2">
          {campaign.city && (
            <div className="text-sm">
              <span className="font-medium">City:</span> {campaign.city}
            </div>
          )}
          
          {campaign.categories && campaign.categories.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Categories:</p>
              <div className="flex flex-wrap gap-1">
                {campaign.categories.map((category) => (
                  <Badge key={category} variant="outline">{category}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {!isAdmin && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => onApply && onApply(campaign.id)}
            variant={hasApplied ? "outline" : "default"}
            disabled={hasApplied}
          >
            {hasApplied ? 'Applied' : 'Apply'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default CampaignCard;

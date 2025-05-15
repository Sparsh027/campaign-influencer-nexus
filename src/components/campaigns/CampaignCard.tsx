
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Campaign } from '@/types/data';

interface CampaignCardProps {
  campaign: Campaign;
  applied: boolean;
  onApply: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, applied, onApply }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">{campaign.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {campaign.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          {campaign.city && (
            <div className="flex items-center text-sm">
              <span className="font-medium mr-2">Location:</span> {campaign.city}
            </div>
          )}
          {campaign.minFollowers > 0 && (
            <div className="flex items-center text-sm">
              <span className="font-medium mr-2">Min Followers:</span> {campaign.minFollowers.toLocaleString()}
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {campaign.categories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onApply} 
          className="w-full" 
          disabled={applied}
        >
          {applied ? 'Applied' : 'Apply Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};

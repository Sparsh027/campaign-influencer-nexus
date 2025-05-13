
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash, Eye, Calendar, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdminCampaigns() {
  const { campaigns, deleteCampaign } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<string | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => setIsNewCampaignOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col h-full overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant={
                      campaign.status === 'active' ? 'default' : 
                      campaign.status === 'completed' ? 'secondary' : 'outline'
                    }
                    className="mb-2"
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
                <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="py-2 flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{campaign.minFollowers.toLocaleString()} min followers</span>
                  </div>
                  
                  {campaign.city && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{campaign.city}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {campaign.categories.slice(0, 3).map(category => (
                      <Badge key={category} variant="outline" className="text-xs">{category}</Badge>
                    ))}
                    {campaign.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{campaign.categories.length - 3}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/campaign/${campaign.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditCampaign(campaign.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setDeleteCampaignId(campaign.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No campaigns found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or create a new campaign.
              </p>
            </div>
            <Button onClick={() => setIsNewCampaignOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {isNewCampaignOpen && (
        <div>
          {/* Import these components dynamically when available */}
        </div>
      )}
      
      {editCampaign && (
        <div>
          {/* Import these components dynamically when available */}
        </div>
      )}
      
      {deleteCampaignId && (
        <div>
          {/* Import these components dynamically when available */}
        </div>
      )}
    </div>
  );
}

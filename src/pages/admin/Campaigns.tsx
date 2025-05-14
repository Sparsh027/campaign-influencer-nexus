
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdminCampaigns() {
  const { campaigns, deleteCampaign } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => window.location.href = '/admin/campaign/new'}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
      
      <div className="flex items-center w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
                <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {campaign.categories.slice(0, 3).map(category => (
                      <Badge key={category} variant="outline">{category}</Badge>
                    ))}
                    {campaign.categories.length > 3 && (
                      <Badge variant="outline">+{campaign.categories.length - 3}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min Followers</p>
                      <p className="font-medium">{campaign.minFollowers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">City</p>
                      <p className="font-medium">{campaign.city || 'Any'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          campaign.status === 'active' ? 'default' : 
                          campaign.status === 'completed' ? 'secondary' : 'outline'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2 border-t">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/admin/campaign/${campaign.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = `/admin/campaign/${campaign.id}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDeleteCampaignId(campaign.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No campaigns found</p>
          </CardContent>
        </Card>
      )}

      {deleteCampaignId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Campaign</CardTitle>
              <CardDescription>Are you sure you want to delete this campaign? This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCampaignId(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  await deleteCampaign(deleteCampaignId);
                  setDeleteCampaignId(null);
                }}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

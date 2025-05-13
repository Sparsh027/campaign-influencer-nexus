
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash, Eye } from 'lucide-react';
import { format } from 'date-fns';

import NewCampaignDialog from '@/components/admin/NewCampaignDialog';
import EditCampaignDialog from '@/components/admin/EditCampaignDialog';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';

export default function AdminCampaigns() {
  const { campaigns, deleteCampaign } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<string | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage your campaign listings and influencer opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Min. Followers</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {campaign.categories.slice(0, 2).map(category => (
                            <Badge key={category} variant="outline">{category}</Badge>
                          ))}
                          {campaign.categories.length > 2 && (
                            <Badge variant="outline">+{campaign.categories.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{campaign.minFollowers.toLocaleString()}</TableCell>
                      <TableCell>{campaign.city || '-'}</TableCell>
                      <TableCell>{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === 'active' ? 'default' : 
                            campaign.status === 'completed' ? 'secondary' : 'outline'
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link to={`/admin/campaign/${campaign.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewCampaignDialog 
        open={isNewCampaignOpen} 
        onOpenChange={setIsNewCampaignOpen} 
      />
      
      {editCampaign && (
        <EditCampaignDialog 
          open={!!editCampaign} 
          onOpenChange={() => setEditCampaign(null)}
          campaignId={editCampaign}
        />
      )}
      
      {deleteCampaignId && (
        <DeleteConfirmDialog
          open={!!deleteCampaignId}
          onOpenChange={() => setDeleteCampaignId(null)}
          title="Delete Campaign"
          description="Are you sure you want to delete this campaign? This action cannot be undone."
          onConfirm={async () => {
            await deleteCampaign(deleteCampaignId);
            setDeleteCampaignId(null);
          }}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Campaign } from '@/types/data';
import { InfluencerUser } from '@/types/auth';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Check, FileEdit, MoreVertical, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'travel', label: 'Travel' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'food', label: 'Food' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'technology', label: 'Technology' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'health', label: 'Health' },
  { id: 'parenting', label: 'Parenting' },
  { id: 'business', label: 'Business' },
  { id: 'education', label: 'Education' },
  { id: 'entertainment', label: 'Entertainment' },
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Austin',
  'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin', 'Toronto', 'Dubai', 'Singapore'
];

// Form schema for campaign creation
const campaignSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  minFollowers: z.coerce.number().min(100, { message: 'Minimum followers must be at least 100' }),
  categories: z.array(z.string()).min(1, { message: 'Select at least one category' }),
  city: z.string().min(2, { message: 'City is required' }),
  status: z.enum(['active', 'completed', 'draft']).default('active'),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function AdminCampaigns() {
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, getEligibleInfluencers } = useData();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCampaignForInfluencers, setSelectedCampaignForInfluencers] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.city.toLowerCase().includes(searchTerm.toLowerCase());
                         
    if (!matchesSearch) return false;
    
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return campaign.status === 'active';
    if (activeTab === 'completed') return campaign.status === 'completed';
    if (activeTab === 'draft') return campaign.status === 'draft';
    
    return true;
  });

  const createForm = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      minFollowers: 1000,
      categories: [],
      city: '',
      status: 'active',
    },
  });

  const editForm = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: '',
      description: '',
      minFollowers: 1000,
      categories: [],
      city: '',
      status: 'active',
    },
  });

  // Load selected campaign data into edit form
  React.useEffect(() => {
    if (selectedCampaign) {
      editForm.reset({
        title: selectedCampaign.title,
        description: selectedCampaign.description,
        minFollowers: selectedCampaign.minFollowers,
        categories: selectedCampaign.categories,
        city: selectedCampaign.city,
        status: selectedCampaign.status,
      });
    }
  }, [selectedCampaign, editForm]);

  const onCreateSubmit = async (values: CampaignFormValues) => {
    try {
      // Fix: Ensure all required properties are passed to createCampaign
      await createCampaign({
        title: values.title,
        description: values.description,
        minFollowers: values.minFollowers,
        categories: values.categories,
        city: values.city,
        status: values.status,
      });
      createForm.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const onEditSubmit = async (values: CampaignFormValues) => {
    if (!selectedCampaign) return;
    
    try {
      await updateCampaign(selectedCampaign.id, values);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(id);
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  const eligibleInfluencers = selectedCampaignForInfluencers
    ? getEligibleInfluencers(selectedCampaignForInfluencers.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
                onEdit={(campaign) => {
                  setSelectedCampaign(campaign);
                  setIsEditDialogOpen(true);
                }}
                onShowInfluencers={(campaign) => setSelectedCampaignForInfluencers(campaign)}
              />
            ))
          ) : (
            <Card className="flex justify-center py-8">
              <p className="text-muted-foreground">No campaigns found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
                onEdit={(campaign) => {
                  setSelectedCampaign(campaign);
                  setIsEditDialogOpen(true);
                }}
                onShowInfluencers={(campaign) => setSelectedCampaignForInfluencers(campaign)}
              />
            ))
          ) : (
            <Card className="flex justify-center py-8">
              <p className="text-muted-foreground">No active campaigns found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
                onEdit={(campaign) => {
                  setSelectedCampaign(campaign);
                  setIsEditDialogOpen(true);
                }}
                onShowInfluencers={(campaign) => setSelectedCampaignForInfluencers(campaign)}
              />
            ))
          ) : (
            <Card className="flex justify-center py-8">
              <p className="text-muted-foreground">No completed campaigns found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="draft" className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={handleDelete}
                onEdit={(campaign) => {
                  setSelectedCampaign(campaign);
                  setIsEditDialogOpen(true);
                }}
                onShowInfluencers={(campaign) => setSelectedCampaignForInfluencers(campaign)}
              />
            ))
          ) : (
            <Card className="flex justify-center py-8">
              <p className="text-muted-foreground">No draft campaigns found</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign for influencers to apply to.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Fashion Collection" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the campaign objectives, requirements, and what influencers will be expected to do."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="minFollowers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Followers</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Minimum number of followers required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input 
                          list="cities"
                          placeholder="Choose a city"
                          {...field}
                        />
                      </FormControl>
                      <datalist id="cities">
                        {CITIES.map(city => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                      <FormDescription>
                        Location for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Campaign</FormLabel>
                      <FormDescription>
                        Make this campaign immediately available to influencers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'draft')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Categories</FormLabel>
                      <FormDescription>
                        Select relevant categories for this campaign
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {CATEGORIES.map((category) => (
                        <FormField
                          key={category.id}
                          control={createForm.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {category.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Campaign</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              {/* Same form fields as create dialog */}
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Fashion Collection" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the campaign objectives, requirements, and what influencers will be expected to do."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="minFollowers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Followers</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Minimum number of followers required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input 
                          list="edit-cities"
                          placeholder="Choose a city"
                          {...field}
                        />
                      </FormControl>
                      <datalist id="edit-cities">
                        {CITIES.map(city => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                      <FormDescription>
                        Location for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Campaign</FormLabel>
                      <FormDescription>
                        Make this campaign immediately available to influencers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'draft')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Categories</FormLabel>
                      <FormDescription>
                        Select relevant categories for this campaign
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {CATEGORIES.map((category) => (
                        <FormField
                          key={category.id}
                          control={editForm.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {category.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Eligible Influencers Dialog */}
      <Dialog 
        open={!!selectedCampaignForInfluencers} 
        onOpenChange={(open) => !open && setSelectedCampaignForInfluencers(null)}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eligible Influencers</DialogTitle>
            <DialogDescription>
              Influencers who meet the criteria for {selectedCampaignForInfluencers?.title}
            </DialogDescription>
          </DialogHeader>
          
          {eligibleInfluencers.length > 0 ? (
            <div className="space-y-4">
              {eligibleInfluencers.map(influencer => (
                <Card key={influencer.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{influencer.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{influencer.instagram} • {influencer.followerCount?.toLocaleString()} followers</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserCheck className="mr-2 h-4 w-4" /> Invite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No eligible influencers found</h3>
              <p className="text-muted-foreground text-center mt-2">
                Try adjusting your campaign requirements to reach more influencers.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onShowInfluencers: (campaign: Campaign) => void;
}

function CampaignCard({ campaign, onEdit, onDelete, onShowInfluencers }: CampaignCardProps) {
  const statusColor = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    draft: 'bg-gray-500',
  }[campaign.status];

  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{campaign.title}</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusColor}`} />
              <CardDescription className="capitalize">
                {campaign.status}
              </CardDescription>
              <CardDescription>•</CardDescription>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(campaign)}>
                <FileEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowInfluencers(campaign)}>
                <Users className="mr-2 h-4 w-4" /> View Eligible Influencers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(campaign.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-2">
        <div className="w-full flex flex-wrap gap-2 mb-2">
          {campaign.categories.map(category => (
            <Badge key={category} variant="outline" className="capitalize">
              {category}
            </Badge>
          ))}
        </div>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{campaign.minFollowers.toLocaleString()} min. followers</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {campaign.city}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

const ViewCampaignAction: React.FC<{ id: string }> = ({ id }) => {
  const navigate = useNavigate();
  
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => navigate(`/campaigns/${id}`)}>
        View Details
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleDelete(id)}>
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

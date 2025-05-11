
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Users } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Campaign, Application } from '@/types/data';
import { User } from '@/types/auth';

// Categories for campaigns
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

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  minFollowers: z.coerce.number().min(100, { message: 'Minimum 100 followers required' }),
  categories: z.array(z.string()).min(1, { message: 'Select at least one category' }),
  city: z.string().optional(),
  status: z.enum(['active', 'draft', 'completed']),
});

export default function AdminCampaigns() {
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, getEligibleInfluencers } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      minFollowers: 1000,
      categories: [],
      city: '',
      status: 'active',
    },
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isCreating) {
      form.reset({
        title: '',
        description: '',
        minFollowers: 1000,
        categories: [],
        city: '',
        status: 'active',
      });
    } else if (isEditing && selectedCampaign) {
      form.reset({
        title: selectedCampaign.title,
        description: selectedCampaign.description,
        minFollowers: selectedCampaign.minFollowers,
        categories: selectedCampaign.categories,
        city: selectedCampaign.city,
        status: selectedCampaign.status,
      });
    }
  }, [isCreating, isEditing, selectedCampaign, form]);

  const handleOpenEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditing(campaign.id);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (isCreating) {
        await createCampaign(values);
        setIsCreating(false);
      } else if (isEditing && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, values);
        setIsEditing(null);
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error('Campaign action error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(id);
      } catch (error) {
        console.error('Delete campaign error:', error);
      }
    }
  };

  // Get eligible influencers for the selected campaign
  const eligibleInfluencers = selectedCampaign 
    ? getEligibleInfluencers(selectedCampaign.id) 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Create a new campaign for influencers to apply to. Define eligibility criteria to automatically filter suitable influencers.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Collection Promotion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed campaign description..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="minFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Followers</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum follower count required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Target city for this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex space-x-4">
                        {(['active', 'draft', 'completed'] as const).map((status) => (
                          <FormItem key={status} className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                checked={field.value === status}
                                onChange={() => field.onChange(status)}
                                className="h-4 w-4 text-brand-600"
                              />
                            </FormControl>
                            <FormLabel className="capitalize font-normal">
                              {status}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Categories</FormLabel>
                        <FormDescription>
                          Select categories relevant to this campaign
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CATEGORIES.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
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
                  <Button variant="outline" onClick={() => setIsCreating(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update the details and eligibility criteria for this campaign.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                {/* Same form fields as the create form */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Collection Promotion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed campaign description..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="minFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Followers</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum follower count required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Target city for this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex space-x-4">
                        {(['active', 'draft', 'completed'] as const).map((status) => (
                          <FormItem key={status} className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                checked={field.value === status}
                                onChange={() => field.onChange(status)}
                                className="h-4 w-4 text-brand-600"
                              />
                            </FormControl>
                            <FormLabel className="capitalize font-normal">
                              {status}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Categories</FormLabel>
                        <FormDescription>
                          Select categories relevant to this campaign
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CATEGORIES.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
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
                  <Button variant="outline" onClick={() => setIsEditing(null)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns list */}
      <div className="grid gap-6">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => {
            const eligibleCount = getEligibleInfluencers(campaign.id).length;
            
            return (
              <Card key={campaign.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{campaign.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Created on {new Date(campaign.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={campaign.status === 'active' ? 'default' : 
                              campaign.status === 'completed' ? 'secondary' : 'outline'}
                      className="capitalize"
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm mb-4">{campaign.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min. Followers</p>
                      <p className="font-medium">{campaign.minFollowers.toLocaleString()}</p>
                    </div>
                    
                    {campaign.city && (
                      <div>
                        <p className="text-muted-foreground">City</p>
                        <p className="font-medium">{campaign.city}</p>
                      </div>
                    )}
                    
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-muted-foreground mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.categories.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {eligibleCount} eligible influencers
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(campaign)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedCampaign(campaign)}>
                          <Users className="h-4 w-4 mr-1" /> View Eligible
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Eligible Influencers</DialogTitle>
                          <DialogDescription>
                            Influencers who meet the criteria for "{campaign.title}"
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          {eligibleInfluencers.length > 0 ? (
                            <div className="space-y-4">
                              {eligibleInfluencers.map((influencer) => (
                                <div key={influencer.id} className="flex justify-between items-center p-3 border rounded-md">
                                  <div>
                                    <p className="font-medium">{influencer.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {influencer.instagram} · {influencer.followerCount?.toLocaleString()} followers
                                    </p>
                                  </div>
                                  <Button variant="outline" size="sm">View Profile</Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-8">
                              No eligible influencers found for this campaign
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <Card className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">
              No campaigns created yet. Create your first campaign.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

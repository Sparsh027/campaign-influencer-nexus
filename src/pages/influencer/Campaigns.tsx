import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function InfluencerCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [applicationText, setApplicationText] = React.useState("");
  const [open, setOpen] = React.useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  const { campaigns, applications, applyToCampaign, getEligibleCampaigns, hasApplied } = useData();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'influencer') {
      navigate('/admin/dashboard');
    } else {
      setLoading(false);
    }
  }, [user, navigate]);
  
  // Determine eligible campaigns and filter based on search/filters
  const eligibleCampaigns = useMemo(() => {
    // Get campaigns the user is eligible for
    const baseEligibleCampaigns = getEligibleCampaigns();
    
    // Apply search query filter
    const searchedCampaigns = baseEligibleCampaigns.filter(campaign =>
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply category filter
    const categoryFilteredCampaigns = selectedCategories.length > 0 ? searchedCampaigns.filter(campaign =>
      campaign.categories.some(category => selectedCategories.includes(category))
    ) : searchedCampaigns;
    
    // Apply city filter
    const cityFilteredCampaigns = selectedCity ? categoryFilteredCampaigns.filter(campaign =>
      campaign.city === selectedCity
    ) : categoryFilteredCampaigns;
    
    return cityFilteredCampaigns;
  }, [getEligibleCampaigns, searchQuery, selectedCategories, selectedCity]);
  
  // Get all unique categories and cities from campaigns
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    campaigns.forEach(campaign => {
      campaign.categories.forEach(category => categories.add(category));
    });
    return Array.from(categories);
  }, [campaigns]);
  
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    campaigns.forEach(campaign => {
      if (campaign.city) {
        cities.add(campaign.city);
      }
    });
    return Array.from(cities);
  }, [campaigns]);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };
  
  const handleApplyToCampaign = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setOpen(true);
  };

  const submitApplication = async () => {
    if (!selectedCampaignId) return;

    try {
      setLoading(true);
      await applyToCampaign(selectedCampaignId);
      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });
      setOpen(false);
      setApplicationText("");
    } catch (error) {
      console.error('Error applying to campaign:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Available Campaigns</h1>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <Input
          type="text"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Cities</SelectItem>
            {allCities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <ScrollArea className="rounded-md border p-2">
        <div className="flex flex-wrap gap-2">
          {allCategories.map(category => (
            <Badge
              key={category}
              variant={selectedCategories.includes(category) ? "default" : "outline"}
              onClick={() => handleCategorySelect(category)}
              className="cursor-pointer"
            >
              {category}
            </Badge>
          ))}
        </div>
      </ScrollArea>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {eligibleCampaigns.length > 0 ? (
          eligibleCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              applied={hasApplied(campaign.id, user?.dbId || '')}
              onApply={() => handleApplyToCampaign(campaign.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center">
            <p className="text-muted-foreground">No campaigns found matching your criteria.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Application</DialogTitle>
            <DialogDescription>
              Write a short message to the campaign owner to introduce yourself and explain why you'd be a good fit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="applicationText" className="text-right">
                Message
              </Label>
              <Textarea id="applicationText" className="col-span-3" value={applicationText} onChange={(e) => setApplicationText(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={submitApplication}>Submit Application</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

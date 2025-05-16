
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';

export default function InfluencerCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('all'); // Using 'all' instead of empty string
  const [loading, setLoading] = useState(true);
  const [applicationText, setApplicationText] = useState("");
  const [open, setOpen] = useState(false);
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
  
  // Show all active campaigns, not just eligible ones
  const activeCampaigns = useMemo(() => {
    return campaigns.filter(campaign => campaign.status === 'active');
  }, [campaigns]);
  
  // Add filtering to active campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = activeCampaigns;
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (campaign) => 
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(campaign => 
        campaign.categories.some(category => selectedCategories.includes(category))
      );
    }
    
    // Apply city filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(campaign => campaign.city === selectedCity);
    }
    
    return filtered;
  }, [activeCampaigns, searchQuery, selectedCategories, selectedCity]);
  
  // Get all unique categories and cities from campaigns
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    campaigns.forEach((campaign) => {
      campaign.categories.forEach((category) => categories.add(category));
    });
    return Array.from(categories);
  }, [campaigns]);
  
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    campaigns.forEach((campaign) => {
      if (campaign.city) {
        cities.add(campaign.city);
      }
    });
    return Array.from(cities);
  }, [campaigns]);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
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
      await applyToCampaign(selectedCampaignId, applicationText);
      toast({
        title: "Success",
        description: "Application submitted successfully!"
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
            <SelectItem value="all">All Cities</SelectItem>
            {allCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {allCategories.length > 0 && (
        <ScrollArea className="whitespace-nowrap">
          <div className="flex space-x-2 pb-2">
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              hasApplied={hasApplied(campaign.id, user?.dbId || '')}
              onApply={() => handleApplyToCampaign(campaign.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No campaigns found based on your filters.</p>
        </div>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Campaign</DialogTitle>
            <DialogDescription>
              Submit your application for this campaign. Tell the brand why you're a good fit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Application Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Why are you interested in this campaign?"
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitApplication}>Submit Application</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

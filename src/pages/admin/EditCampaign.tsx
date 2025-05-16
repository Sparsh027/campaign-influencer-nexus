
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';

const campaignSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Please provide a detailed description." }),
  minFollowers: z.coerce.number().int().min(0),
  categories: z.string().array().min(1, { message: "Select at least one category." }),
  cities: z.string().array().optional().default([]),
  status: z.enum(["draft", "active", "completed"]),
  initialBudget: z.coerce.number().optional(),
});

const categoryOptions = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Lifestyle",
  "Technology",
  "Gaming",
  "Entertainment",
  "Business",
];

export default function EditCampaign() {
  const { campaignId } = useParams();
  const { campaigns, updateCampaign } = useData();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      minFollowers: 1000,
      categories: [],
      cities: [],
      status: "draft",
      initialBudget: 0,
    },
  });

  // Load campaign data
  useEffect(() => {
    if (campaignId) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        // Parse cities from the comma-separated string
        const cityList = campaign.city ? campaign.city.split(", ").filter(Boolean) : [];

        form.reset({
          title: campaign.title,
          description: campaign.description,
          minFollowers: campaign.minFollowers,
          categories: campaign.categories,
          cities: cityList,
          status: campaign.status,
        });
        setSelectedCategories(campaign.categories);
        setSelectedCities(cityList);
        setLoading(false);
      } else {
        toast.error("Campaign not found");
        navigate('/admin/campaigns');
      }
    }
  }, [campaignId, campaigns, form, navigate]);

  const onSubmit = async (data: z.infer<typeof campaignSchema>) => {
    if (!campaignId) return;
    
    try {
      await updateCampaign(campaignId, {
        title: data.title,
        description: data.description,
        minFollowers: data.minFollowers,
        categories: selectedCategories,
        city: selectedCities.join(", "),
        status: data.status,
      });
      
      toast.success("Campaign updated successfully");
      navigate(`/admin/campaign/${campaignId}`);
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  const handleAddCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category));
  };
  
  const handleAddCity = () => {
    if (cityInput && !selectedCities.includes(cityInput)) {
      setSelectedCities([...selectedCities, cityInput]);
      setCityInput("");
    }
  };

  const handleRemoveCity = (city: string) => {
    setSelectedCities(selectedCities.filter((c) => c !== city));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(`/admin/campaign/${campaignId}`)} className="mr-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Campaign title" {...field} />
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
                      <Textarea placeholder="Campaign description" {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minFollowers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Followers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Minimum followers"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <div className="space-y-2">
                      <Select
                        onValueChange={handleAddCategory}
                        value=""
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedCategories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm"
                            >
                              {category}
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(category)}
                                className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cities"
                render={() => (
                  <FormItem>
                    <FormLabel>Cities (Optional)</FormLabel>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add a city"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddCity}
                          disabled={!cityInput}
                        >
                          Add
                        </Button>
                      </div>
                      {selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedCities.map((city) => (
                            <div
                              key={city}
                              className="flex items-center bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm"
                            >
                              {city}
                              <button
                                type="button"
                                onClick={() => handleRemoveCity(city)}
                                className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-end gap-2 px-0 pt-4">
                <Button variant="outline" onClick={() => navigate(`/admin/campaign/${campaignId}`)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const campaignSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Please provide a detailed description." }),
  minFollowers: z.coerce.number().int().min(0),
  categories: z.string().array().min(1, { message: "Select at least one category." }),
  cities: z.string().array().optional().default([]),
  status: z.enum(["draft", "active", "completed"]),
  initialBudget: z.coerce.number().min(0, { message: "Budget must be a positive number." }),
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

interface NewCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewCampaignDialog({ open, onOpenChange }: NewCampaignDialogProps) {
  const { createCampaign } = useData();
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

  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [cityInput, setCityInput] = React.useState<string>("");

  const onSubmit = async (data: z.infer<typeof campaignSchema>) => {
    try {
      const newCampaign = await createCampaign({
        title: data.title,
        description: data.description,
        minFollowers: data.minFollowers,
        categories: selectedCategories,
        city: selectedCities.join(", "),
        status: data.status,
        initialBudget: data.initialBudget,
      });
      
      form.reset();
      setSelectedCategories([]);
      setSelectedCities([]);
      setCityInput("");
      onOpenChange(false);
      toast.success("Campaign created successfully");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new campaign for influencers to apply to.
          </DialogDescription>
        </DialogHeader>
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
                    <Textarea placeholder="Campaign description" {...field} />
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
              
              <FormField
                control={form.control}
                name="initialBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Budget</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Budget amount"
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
                    defaultValue={field.value}
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
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Campaign</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

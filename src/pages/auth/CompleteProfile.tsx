
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Categories for influencers to select from
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
  name: z.string().min(2, { message: 'Name is required' }),
  instagram: z.string().min(1, { message: 'Instagram handle is required' }),
  followerCount: z.coerce.number().min(100, { message: 'Minimum 100 followers required' }),
  phone: z.string().min(10, { message: 'Valid phone number required' }),
  city: z.string().min(2, { message: 'City is required' }),
  categories: z.array(z.string()).min(1, { message: 'Select at least one category' }),
});

export default function CompleteProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if user is not logged in or is admin
  React.useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'influencer' && user.profileCompleted) {
      navigate('/influencer/dashboard');
    }
  }, [user, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      instagram: '',
      followerCount: undefined,
      phone: '',
      city: '',
      categories: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await updateProfile({
        ...values,
        profileCompleted: true,
      });
      toast.success('Profile completed successfully!');
      navigate('/influencer/dashboard');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-50 to-white">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">Let's set up your influencer profile</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram Handle</FormLabel>
                      <FormControl>
                        <Input placeholder="@yourhandle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follower Count</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
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
                    <div className="mb-4">
                      <FormLabel>Categories</FormLabel>
                      <FormDescription>
                        Select the categories that best describe your content
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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

              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

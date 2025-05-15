
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ban, Search, Trash2, User } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { InfluencerUser } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

export default function AdminInfluencers() {
  const { influencers, blockInfluencer, deleteInfluencer, fetchInfluencers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerUser | null>(null);
  
  // Fetch influencers on component mount
  useEffect(() => {
    fetchInfluencers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInfluencers = influencers.filter(influencer => 
    influencer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.instagram?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBlock = async (id: string) => {
    if (window.confirm('Are you sure you want to block this influencer?')) {
      try {
        await blockInfluencer(id);
        toast({
          title: "Success",
          description: "Influencer has been blocked",
        });
      } catch (error) {
        console.error('Block influencer error:', error);
        toast({
          title: "Error",
          description: "Failed to block influencer",
          variant: "destructive"
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this influencer? This cannot be undone.')) {
      try {
        await deleteInfluencer(id);
        toast({
          title: "Success",
          description: "Influencer has been deleted",
        });
      } catch (error) {
        console.error('Delete influencer error:', error);
        toast({
          title: "Error",
          description: "Failed to delete influencer",
          variant: "destructive"
        });
      }
    }
  };

  console.log("Current influencers:", influencers);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Influencers</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or location..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredInfluencers.length > 0 ? (
          filteredInfluencers.map((influencer) => (
            <Card key={influencer.dbId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{influencer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{influencer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedInfluencer(influencer)}>
                      <User className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleBlock(influencer.dbId)}>
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(influencer.dbId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Instagram</p>
                    <p className="font-medium">{influencer.instagram || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Followers</p>
                    <p className="font-medium">{influencer.followerCount?.toLocaleString() || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{influencer.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{influencer.city || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-muted-foreground mb-1">Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {influencer.categories && influencer.categories.length > 0 ? (
                        influencer.categories.map((category) => (
                          <Badge key={category} variant="outline" className="capitalize">
                            {category}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No categories specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? 'No influencers match your search criteria.' : 'No influencers registered yet.'}
            </p>
          </Card>
        )}
      </div>

      {/* Influencer details dialog */}
      {selectedInfluencer && (
        <Dialog open={!!selectedInfluencer} onOpenChange={(open) => !open && setSelectedInfluencer(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Influencer Profile</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedInfluencer.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-brand-600" />
                </div>
                <h2 className="text-xl font-bold">{selectedInfluencer.name}</h2>
                <p className="text-muted-foreground">{selectedInfluencer.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedInfluencer.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedInfluencer.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Instagram:</span>
                      <span>{selectedInfluencer.instagram || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{selectedInfluencer.city || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Influencer Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Followers:</span>
                      <span>{selectedInfluencer.followerCount?.toLocaleString() || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Profile Status:</span>
                      <span>{selectedInfluencer.profileCompleted ? 'Complete' : 'Incomplete'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Account Created:</span>
                      <span>{new Date(selectedInfluencer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedInfluencer.categories && selectedInfluencer.categories.length > 0 ? (
                    selectedInfluencer.categories.map((category) => (
                      <Badge key={category} variant="outline" className="capitalize">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories specified</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => handleBlock(selectedInfluencer.dbId)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Block Influencer
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedInfluencer.dbId);
                    setSelectedInfluencer(null);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

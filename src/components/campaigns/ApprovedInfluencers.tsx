
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { InfluencerUser } from '@/types/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ApprovedInfluencersProps {
  campaignId: string;
}

export default function ApprovedInfluencers({ campaignId }: ApprovedInfluencersProps) {
  const { applications, influencers, sendMessage } = useData();
  
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerUser | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Filter for approved applications
  const approvedApplications = applications.filter(app => 
    app.campaignId === campaignId && app.status === 'approved'
  );
  
  const getInfluencer = (influencerId: string): InfluencerUser | undefined => {
    return influencers.find(inf => inf.dbId === influencerId);
  };
  
  if (approvedApplications.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-muted-foreground">No approved influencers for this campaign yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const openMessageDialog = (influencer: InfluencerUser) => {
    setSelectedInfluencer(influencer);
    setMessageContent('');
    setMessageOpen(true);
  };
  
  const handleSendMessage = async () => {
    if (!selectedInfluencer || !messageContent.trim()) return;
    
    setSendingMessage(true);
    try {
      await sendMessage(selectedInfluencer.dbId, messageContent);
      setMessageOpen(false);
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Approved On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedApplications.map((application) => {
                  const influencer = getInfluencer(application.influencerId);
                  if (!influencer) return null;
                  
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{influencer.name}</TableCell>
                      <TableCell>{influencer.instagram || '-'}</TableCell>
                      <TableCell>{influencer.followerCount?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {influencer.categories?.map((category) => (
                            <Badge key={category} variant="outline">{category}</Badge>
                          )) || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openMessageDialog(influencer)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedInfluencer?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Type your message here..."
              className="min-h-[120px]"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setMessageOpen(false)}
              variant="outline"
              disabled={sendingMessage}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!messageContent.trim() || sendingMessage}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

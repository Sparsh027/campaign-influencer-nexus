
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Application, Campaign } from '@/types/data';

export default function InfluencerApplications() {
  const { user } = useAuth();
  const { applications, campaigns, sendMessage } = useData();
  const navigate = useNavigate();

  // Get user's applications with campaign details
  const userApplications = applications
    .filter(app => app.influencerId === user?.dbId)
    .map(app => {
      const campaign = campaigns.find(c => c.id === app.campaignId);
      return { ...app, campaign };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleContactAdmin = async (application: Application & { campaign?: Campaign }) => {
    if (!application.campaign || !user) return;
    
    try {
      // Get admin ID
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .single();
        
      if (adminError || !adminData) {
        console.error('Error getting admin ID:', adminError);
        return;
      }
      
      // Send initial message
      await sendMessage(adminData.id, `Hello, I'd like to discuss my application for the "${application.campaign.title}" campaign.`);
      
      // Navigate to inbox
      navigate('/influencer/inbox');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Your Applications</h1>

      <div className="grid gap-6">
        {userApplications.length > 0 ? (
          userApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-xl">{application.campaign?.title || 'Unknown Campaign'}</CardTitle>
                  <Badge 
                    variant={
                      application.status === 'approved' ? 'default' :
                      application.status === 'rejected' ? 'destructive' : 'outline'
                    }
                    className="capitalize"
                  >
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.campaign && (
                    <p className="text-sm">{application.campaign.description}</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Applied on {new Date(application.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => handleContactAdmin(application)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Connect with Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't applied to any campaigns yet.
            </p>
            <Link to="/influencer/campaigns">
              <Button>Browse Campaigns</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { BarChart, Users, LayoutDashboard, MessageSquare, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';

// Helper function to safely format dates
const safeFormat = (dateString: string | undefined, formatString: string): string => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return isValid(date) ? format(date, formatString) : 'Invalid date';
};

export default function AdminDashboard() {
  const { campaigns, influencers, applications, notifications } = useData();
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const recentNotifications = [...notifications]
    .filter(n => n.targetType === 'admin')
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return isValid(dateB) && isValid(dateA) ? dateB.getTime() - dateA.getTime() : 0;
    })
    .slice(0, 5);

  // Get recent influencer signups
  const recentInfluencers = [...influencers]
    .filter(inf => inf.createdAt) // Filter out influencers without createdAt
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return isValid(dateB) && isValid(dateA) ? dateB.getTime() - dateA.getTime() : 0;
    })
    .slice(0, 3);

  // Get recent applications
  const recentApplications = applications
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return isValid(dateB) && isValid(dateA) ? dateB.getTime() - dateA.getTime() : 0;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCampaigns.length} active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{influencers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(influencers.length * 0.8)} active profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {applications.length} total applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'new_message' && !n.read && n.targetType === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {new Set(notifications.filter(n => n.type === 'new_message' && n.targetType === 'admin').map(n => n.message.split(' from ')[1])).size} influencers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent platform updates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>Latest platform activity</span>
              {(recentInfluencers.length > 0 || activeCampaigns.length > 0) && (
                <Button variant="link" size="sm" className="p-0" asChild>
                  <Link to="/admin/notifications">View All</Link>
                </Button>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New influencers who signed up */}
            {recentInfluencers.length > 0 && (
              <>
                <h3 className="text-sm font-medium mb-2">New Influencers</h3>
                {recentInfluencers.map((influencer) => (
                  <div key={`influencer-${influencer.id}`} className="flex items-center gap-4 border-b border-gray-100 pb-3">
                    <div className="bg-brand-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{influencer.name}</p>
                      <div className="flex gap-2 items-center">
                        <p className="text-xs text-muted-foreground">
                          {influencer.createdAt && safeFormat(influencer.createdAt, 'MMM d, yyyy')}
                        </p>
                        <Badge variant="outline" className="text-xs">New</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Active campaigns */}
            {activeCampaigns.length > 0 && (
              <>
                <h3 className="text-sm font-medium mb-2">Active Campaigns</h3>
                {activeCampaigns.slice(0, 3).map((campaign) => (
                  <div key={`campaign-${campaign.id}`} className="flex items-center gap-4 border-b border-gray-100 pb-3">
                    <div className="bg-brand-100 p-2 rounded-full">
                      <BarChart className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{campaign.title}</p>
                      <div className="flex gap-2 items-center">
                        <Badge variant="default" className="text-xs">Active</Badge>
                        <p className="text-xs text-muted-foreground">
                          Created {safeFormat(campaign.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Show notifications if no influencers or campaigns */}
            {recentInfluencers.length === 0 && activeCampaigns.length === 0 && (
              <>
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <div className="bg-brand-100 p-2 rounded-full">
                        <Bell className="h-4 w-4 text-brand-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormat(notification.createdAt, 'MMM d, yyyy, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent updates</p>
                )}
              </>
            )}
            
            {recentNotifications.length > 0 && recentInfluencers.length === 0 && activeCampaigns.length === 0 && (
              <Button variant="outline" size="sm" asChild className="w-full mt-2">
                <Link to="/admin/notifications">View All Updates</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>Latest campaign applications</span>
              {recentApplications.length > 0 && (
                <Button variant="link" size="sm" className="p-0" asChild>
                  <Link to="/admin/applications">View All Applications</Link>
                </Button>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => {
                const campaign = campaigns.find(c => c.id === application.campaignId);
                const influencer = influencers.find(i => i.dbId === application.influencerId);
                
                return (
                  <div key={application.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{influencer?.name || 'Unknown Influencer'}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied to: {campaign?.title || 'Unknown Campaign'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/campaign/${application.campaignId}?tab=applications&highlight=${application.id}`}>
                        Review
                      </Link>
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No recent applications</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

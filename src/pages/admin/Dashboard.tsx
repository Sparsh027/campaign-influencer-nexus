
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { BarChart, Users, LayoutDashboard, MessageSquare, Bell, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { campaigns, influencers, applications, notifications, updateApplicationStatus } = useData();
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const recentNotifications = [...notifications]
    .filter(n => n.targetType === 'admin')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get recent applications sorted by date
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
              {activeCampaigns} active campaigns
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
            <div className="text-2xl font-bold">{activeCampaigns}</div>
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
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center gap-4 border-b border-gray-100 pb-3">
                  <div className="bg-brand-100 p-2 rounded-full">
                    <Bell className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent updates</p>
            )}
            
            {recentNotifications.length > 0 && (
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Updates
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest campaign applications</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/campaigns">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4 p-4">
            {recentApplications.length > 0 ? (
              recentApplications
                .filter(app => app.status === 'pending')
                .map((application) => {
                  const campaign = campaigns.find(c => c.id === application.campaignId);
                  const influencer = influencers.find(i => i.id === application.influencerId);
                  
                  return (
                    <Card key={application.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{influencer?.name || 'Unknown Influencer'}</p>
                              <Badge variant="outline" className="text-xs">
                                {influencer?.followerCount?.toLocaleString() || '0'} followers
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Applied to: {campaign?.title || 'Unknown Campaign'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(application.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link to={`/admin/campaign/${application.campaignId}`}>
                                Review
                              </Link>
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateApplicationStatus(application.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground">No pending applications</p>
            )}
          </CardContent>
          
          <CardFooter className="bg-gray-50 rounded-b-lg border-t p-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/admin/campaigns">
                View All Applications
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { BarChart, Users, LayoutDashboard, MessageSquare, Bell } from 'lucide-react';

export default function AdminDashboard() {
  const { campaigns, influencers, applications, notifications } = useData();
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const recentNotifications = [...notifications]
    .filter(n => n.targetType === 'admin')
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
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest campaign applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applications.length > 0 ? (
              applications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((application) => {
                  const campaign = campaigns.find(c => c.id === application.campaignId);
                  const influencer = influencers.find(i => i.id === application.influencerId);
                  
                  return (
                    <div key={application.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{influencer?.name || 'Unknown Influencer'}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied to: {campaign?.title || 'Unknown Campaign'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Review</Button>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground">No recent applications</p>
            )}
            
            {applications.length > 0 && (
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Applications
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

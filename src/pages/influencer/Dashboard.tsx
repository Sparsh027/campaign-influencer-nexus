
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { BarChart, Users, MessageSquare, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InfluencerUser } from '@/types/auth';

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const { campaigns, applications, notifications, getEligibleCampaigns } = useData();
  
  const influencerUser = user as InfluencerUser | null;
  const eligibleCampaigns = getEligibleCampaigns();
  const userApplications = applications.filter(app => app.influencerId === user?.id);
  
  const recentNotifications = [...notifications]
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      {/* Welcome message */}
      <Card className="bg-gradient-to-r from-brand-500 to-brand-700 text-white">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.name}!</h2>
          <p>Find the perfect campaigns for your profile and start collaborating.</p>
        </CardContent>
      </Card>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Campaigns</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleCampaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Campaigns that match your profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userApplications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {userApplications.filter(a => a.status === 'pending').length} pending applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'new_message' && !n.read && n.userId === user?.id).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Check your inbox for updates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent notifications */}
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
          </CardContent>
        </Card>

        {/* Available campaigns */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Available Campaigns</CardTitle>
            <CardDescription>Campaigns that match your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibleCampaigns.length > 0 ? (
              eligibleCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{campaign.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.minFollowers.toLocaleString()} min. followers
                    </p>
                  </div>
                  <Link to="/influencer/campaigns">
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns match your profile yet.</p>
            )}
            
            {eligibleCampaigns.length > 3 && (
              <div className="pt-2">
                <Link to="/influencer/campaigns">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Available Campaigns
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Profile completion prompt if needed */}
      {influencerUser && (!influencerUser.instagram || !influencerUser.followerCount) && (
        <Card className="border-2 border-brand-300 bg-brand-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-medium text-lg">Complete your profile</h3>
                <p className="text-muted-foreground">Add more details to your profile to access more campaigns.</p>
              </div>
              <Link to="/influencer/settings">
                <Button>Update Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

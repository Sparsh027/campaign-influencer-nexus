
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.dbId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_type', 'admin')
        .eq('target_id', user.dbId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.read).length === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('target_type', 'admin')
        .eq('target_id', user?.dbId)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Set up Supabase realtime subscription for new notifications
  useEffect(() => {
    fetchNotifications();

    if (!user?.dbId) return;

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `target_id=eq.${user.dbId}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.dbId]);

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return '';
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.filter(n => !n.read).length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={notification.read ? 'border-muted' : 'border-l-4 border-l-brand-500'}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {notification.type}
                    </CardTitle>
                    {!notification.read && (
                      <Badge variant="outline" className="bg-brand-100 text-brand-800">New</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-2">{notification.message}</p>
                {!notification.read && (
                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

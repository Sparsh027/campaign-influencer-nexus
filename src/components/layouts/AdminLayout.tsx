
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, BarChart, MessageSquare, Settings, Menu, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    } else if (user.role !== 'admin') {
      navigate('/influencer/dashboard');
    }
  }, [user, navigate]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [navigate, isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { icon: LayoutDashboard, name: 'Dashboard', path: '/admin/dashboard' },
    { icon: BarChart, name: 'Campaigns', path: '/admin/campaigns' },
    { icon: Users, name: 'Influencers', path: '/admin/influencers' },
    { icon: MessageSquare, name: 'Inbox', path: '/admin/inbox' },
    { icon: Bell, name: 'Notifications', path: '/admin/notifications' },
    { icon: Settings, name: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle - moved to right side */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Button
          size="icon"
          variant="outline"
          onClick={toggleSidebar}
          className="rounded-full bg-white shadow-md"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Sidebar Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - still opens from left */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out h-full overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h2 className="text-xl font-bold text-sidebar-foreground">
              Dotfluence <span className="text-brand-500">Admin</span>
            </h2>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info / logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out pt-16 md:pt-0",
        "md:ml-64" // Always push content on desktop
      )}>
        <div className="container max-w-6xl py-8 px-4 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

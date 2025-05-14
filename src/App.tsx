
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// Auth Pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import CompleteProfile from "./pages/auth/CompleteProfile";

// Layouts
import AdminLayout from "./components/layouts/AdminLayout";
import InfluencerLayout from "./components/layouts/InfluencerLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminInfluencers from "./pages/admin/Influencers";
import AdminInbox from "./pages/admin/Inbox";
import AdminSettings from "./pages/admin/Settings";
import CampaignDetail from "./pages/admin/CampaignDetail";
import AdminApplications from "./pages/admin/Applications";

// Influencer Pages
import InfluencerDashboard from "./pages/influencer/Dashboard";
import InfluencerCampaigns from "./pages/influencer/Campaigns";
import InfluencerApplications from "./pages/influencer/Applications";
import InfluencerInbox from "./pages/influencer/Inbox";
import InfluencerSettings from "./pages/influencer/Settings";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/" element={<Navigate to="/sign-in" replace />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="campaign/:campaignId" element={<CampaignDetail />} />
                <Route path="influencers" element={<AdminInfluencers />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="inbox" element={<AdminInbox />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Influencer Routes */}
              <Route path="/influencer" element={<InfluencerLayout />}>
                <Route index element={<Navigate to="/influencer/dashboard" replace />} />
                <Route path="dashboard" element={<InfluencerDashboard />} />
                <Route path="campaigns" element={<InfluencerCampaigns />} />
                <Route path="applications" element={<InfluencerApplications />} />
                <Route path="inbox" element={<InfluencerInbox />} />
                <Route path="settings" element={<InfluencerSettings />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

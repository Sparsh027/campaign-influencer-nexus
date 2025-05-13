import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Index } from "./pages/Index";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { CompleteProfile } from "./pages/CompleteProfile";
import { NotFound } from "./pages/NotFound";

import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminCampaigns } from "./pages/admin/Campaigns";
import { AdminInfluencers } from "./pages/admin/Influencers";
import { AdminInbox } from "./pages/admin/Inbox";
import { AdminSettings } from "./pages/admin/Settings";

import { InfluencerDashboard } from "./pages/influencer/Dashboard";
import { InfluencerCampaigns } from "./pages/influencer/Campaigns";
import { InfluencerApplications } from "./pages/influencer/Applications";
import { InfluencerInbox } from "./pages/influencer/Inbox";
import { InfluencerSettings } from "./pages/influencer/Settings";

import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { CampaignDetail } from "./pages/admin/CampaignDetail";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/not-found" element={<NotFound />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/campaigns" element={<AdminCampaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/admin/influencers" element={<AdminInfluencers />} />
              <Route path="/admin/inbox" element={<AdminInbox />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              
              {/* Influencer routes */}
              <Route path="/influencer" element={<Navigate to="/influencer/dashboard" replace />} />
              <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
              <Route path="/influencer/campaigns" element={<InfluencerCampaigns />} />
              <Route path="/influencer/applications" element={<InfluencerApplications />} />
              <Route path="/influencer/inbox" element={<InfluencerInbox />} />
              <Route path="/influencer/settings" element={<InfluencerSettings />} />
              
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;


import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import AdminLayout from './components/layouts/AdminLayout'
import InfluencerLayout from './components/layouts/InfluencerLayout'

// Importing all pages
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import CompleteProfile from './pages/auth/CompleteProfile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCampaigns from './pages/admin/Campaigns'
import CampaignDetail from './pages/admin/CampaignDetail'
import AdminInbox from './pages/admin/Inbox'
import AdminInfluencers from './pages/admin/Influencers'
import AdminSettings from './pages/admin/Settings'
import InfluencerDashboard from './pages/influencer/Dashboard'
import InfluencerCampaigns from './pages/influencer/Campaigns'
import InfluencerApplications from './pages/influencer/Applications'
import InfluencerInbox from './pages/influencer/Inbox'
import InfluencerSettings from './pages/influencer/Settings'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="influencers" element={<AdminInfluencers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Influencer routes */}
            <Route path="/influencer" element={<InfluencerLayout />}>
              <Route index element={<InfluencerDashboard />} />
              <Route path="dashboard" element={<InfluencerDashboard />} />
              <Route path="campaigns" element={<InfluencerCampaigns />} />
              <Route path="applications" element={<InfluencerApplications />} />
              <Route path="inbox" element={<InfluencerInbox />} />
              <Route path="settings" element={<InfluencerSettings />} />
            </Route>

            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
        </DataProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

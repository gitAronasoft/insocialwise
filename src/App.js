import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/auth/Dashboard';
import EmailVerifiedProcess from './pages/EmailVerifiedProcess';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './PrivateRoute';
import CreatePost from './pages/auth/CreatePost';
import PostCalendar from './pages/auth/PostCalendar';
import EditPost from './pages/auth/EditPost';
import PostsList from './pages/auth/PostsList';
import AllConnectedAccount from './pages/auth/AllConnectedAccount';
// import AllDraftPost from './pages/auth/AllDraftPost';
import CreateAccount from './pages/CreateAccount';
import AccountSetup from './pages/AccountSetup';
import PagesAnalytics from './pages/auth/PagesAnalytics';
import PagesAnalytics_old from './pages/auth/PagesAnalytics-old';
import FacebookAnalyticsDetailPage from './pages/auth/FacebookAnalyticsDetailPage';
import LinkedinAnalyticsDetailPage from './pages/auth/LinkedinAnalyticsDetailPage';
import Settings from './pages/auth/Settings';
import Inbox from './pages/auth/InboxPage';
import AdCampaignComponent from './pages/auth/AdCampaignComponent';
import AdCampaignDetailPage from './pages/auth/AdCampaignDetailPage';
import MyProfile from './pages/auth/Myprofile';
import FullScreenLoader from './pages/auth/FullScreenLoader';
import KnowledgeBase from './pages/auth/knowledge-base';
import ScrollToTop from './pages/auth/components/ScrollToTop';
import ForgetPassword from './pages/ForgetPassword';
import ResetPasswordForm from './pages/ResetPasswordForm';
import Reports from './pages/auth/Report';
import AllPosts from './pages/auth/Allpost';

// ✅ Separate component that uses context
function AppContent() {
  const { loading } = useContext(AuthContext);

  return (
    <>
      {loading && <FullScreenLoader />} {/* Full screen loader overlay */}
      <Router>
        <ScrollToTop/>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/email-verified-process/:uuid" element={<EmailVerifiedProcess />} />
          <Route path="/account-setup" element={<AccountSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/reset-password/:passwordToken" element={<ResetPasswordForm />} />
          {/* Private Routes */}
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/create-post" element={<PrivateRoute element={<CreatePost />} />} />
          <Route path="/edit-post" element={<PrivateRoute element={<EditPost />} />} />
          <Route path="/posts-list" element={<PrivateRoute element={<PostsList />} />} />
          {/* <Route path="/draft-posts" element={<PrivateRoute element={<AllDraftPost />} />} /> */}
          <Route path="/allposts" element={<PrivateRoute element={<AllPosts />} />} />
          <Route path="/all-accounts" element={<PrivateRoute element={<AllConnectedAccount />} />} />
          <Route path="/post-calendar" element={<PrivateRoute element={<PostCalendar />} />} />
          <Route path="/analytics" element={<PrivateRoute element={<PagesAnalytics />} />} /> 
          <Route path="/analytics-old" element={<PrivateRoute element={<PagesAnalytics_old />} />} />
          <Route path="/facebook-analytics-detail" element={<PrivateRoute element={<FacebookAnalyticsDetailPage />} />} />
          <Route path="/linkedin-analytics-detail" element={<PrivateRoute element={<LinkedinAnalyticsDetailPage />} />} />
          <Route path="/settings" element={<PrivateRoute element={<Settings />} />} />
          <Route path="/knowledge-base" element={<PrivateRoute element={<KnowledgeBase />} />} />
          <Route path="/inbox" element={<PrivateRoute element={<Inbox />} />} />
          <Route path="/ads-campaign" element={<PrivateRoute element={<AdCampaignComponent />} />} />
          <Route path="/ads-campaign-detail" element={<PrivateRoute element={<AdCampaignDetailPage />} />} />
          <Route path="/my-profile" element={<PrivateRoute element={<MyProfile />} />} />
          <Route path="/reports" element={<PrivateRoute element={<Reports />} />} />
        </Routes>
      </Router>
    </>
  );
}

// ✅ App just wraps with provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

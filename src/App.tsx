import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import BlockchainDemo from './pages/BlockchainDemo';
import Community from './components/Community';
import HandRotationTracker from './components/HandRotationTracker';
import AdminControl from './pages/AdminControl';
import ReportAnalyzer from './components/ReportAnalyzer';
import { User, FileText } from 'lucide-react';

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);
  const [showBlockchain, setShowBlockchain] = React.useState(false);
  const [showCommunity, setShowCommunity] = React.useState(false);
  const [showHandTracker, setShowHandTracker] = React.useState(false);
  const [showAdminControl, setShowAdminControl] = React.useState(false);
  const [showReportAnalyzer, setShowReportAnalyzer] = React.useState(false);

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowBlockchain(false);
    setShowCommunity(false);
    setShowHandTracker(false);
    setShowAdminControl(false);
    setShowReportAnalyzer(false);
  };

  const toggleBlockchain = () => {
    setShowBlockchain(!showBlockchain);
    setShowProfile(false);
    setShowCommunity(false);
    setShowHandTracker(false);
    setShowAdminControl(false);
    setShowReportAnalyzer(false);
  };

  const toggleCommunity = () => {
    setShowCommunity(!showCommunity);
    setShowProfile(false);
    setShowBlockchain(false);
    setShowHandTracker(false);
    setShowAdminControl(false);
    setShowReportAnalyzer(false);
  };

  const toggleHandTracker = () => {
    setShowHandTracker(!showHandTracker);
    setShowProfile(false);
    setShowBlockchain(false);
    setShowCommunity(false);
    setShowAdminControl(false);
    setShowReportAnalyzer(false);
  };

  const toggleAdminControl = () => {
    setShowAdminControl(!showAdminControl);
    setShowProfile(false);
    setShowBlockchain(false);
    setShowCommunity(false);
    setShowHandTracker(false);
    setShowReportAnalyzer(false);
  };

  const toggleReportAnalyzer = () => {
    setShowReportAnalyzer(!showReportAnalyzer);
    setShowProfile(false);
    setShowBlockchain(false);
    setShowCommunity(false);
    setShowHandTracker(false);
    setShowAdminControl(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Heal-Fit AI Health Assistant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleCommunity}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Community
              </button>
              <button
                onClick={toggleReportAnalyzer}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileText className="h-4 w-4 mr-1" />
                Report Analyzer
              </button>
              <button
                onClick={toggleBlockchain}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Blockchain Demo
              </button>
              <button
                onClick={toggleHandTracker}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Exercise Tracker
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={toggleAdminControl}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Admin Control
                </button>
              )}
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <button
                onClick={toggleProfile}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <User className="h-4 w-4 mr-1" />
                Profile
              </button>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showProfile ? (
          <Profile onClose={() => setShowProfile(false)} />
        ) : showBlockchain ? (
          <BlockchainDemo />
        ) : showCommunity ? (
          <Community />
        ) : showHandTracker ? (
          <HandRotationTracker />
        ) : showAdminControl ? (
          <AdminControl />
        ) : showReportAnalyzer ? (
          <ReportAnalyzer />
        ) : user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
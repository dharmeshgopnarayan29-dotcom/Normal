import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

import AuthPage from './pages/Login_Signup';

// Citizen pages
import CitizenDashboard from './pages/CitizenDashboard';
import Notifications from './pages/Notifications';
import MyComplaints from './pages/MyComplaints';
import CitizenMapView from './pages/CitizenMapView';
import Profile from './pages/Profile';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AllComplaints from './pages/AllComplaints';
import SavedProblems from './pages/SavedProblems';
import AdminMapView from './pages/AdminMapView';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import FlaggedIssues from './pages/FlaggedIssues';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="flex justify-center items-center h-screen font-semibold text-slate-900">Loading CivicConnect...</div>;
    
    if (!user) return <Navigate to="/login" />;
    
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
    }
    
    return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Citizen Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="citizen"><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRole="citizen"><Notifications /></ProtectedRoute>} />
          <Route path="/my-complaints" element={<ProtectedRoute allowedRole="citizen"><MyComplaints /></ProtectedRoute>} />
          <Route path="/citizen-map" element={<ProtectedRoute allowedRole="citizen"><CitizenMapView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRole="citizen"><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute allowedRole="admin"><AllComplaints /></ProtectedRoute>} />
          <Route path="/admin/saved" element={<ProtectedRoute allowedRole="admin"><SavedProblems /></ProtectedRoute>} />
          <Route path="/admin/map" element={<ProtectedRoute allowedRole="admin"><AdminMapView /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><Analytics /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><Reports /></ProtectedRoute>} />
          <Route path="/admin/flagged" element={<ProtectedRoute allowedRole="admin"><FlaggedIssues /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

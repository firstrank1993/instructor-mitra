import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { USER_STATUS } from './config/constants';
import { isUserExpired } from './services/authService';

// Pages - we will create these next
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PendingPage from './pages/auth/PendingPage';
import BlockedPage from './pages/auth/BlockedPage';
import ExpiredPage from './pages/auth/ExpiredPage';
import AdminLayout from './components/layout/AdminLayout';
import InstructorLayout from './components/layout/InstructorLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';

// Loading Spinner Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading Instructor Mitra...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!userData) return <Navigate to="/register" replace />;
  
  if (userData.status === USER_STATUS.BLOCKED) {
    return <Navigate to="/blocked" replace />;
  }
  
  if (isUserExpired(userData)) {
    return <Navigate to="/expired" replace />;
  }
  
  if (userData.status === USER_STATUS.PENDING) {
    return <Navigate to="/pending" replace />;
  }

  if (requiredRole && userData.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, userData, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        user && userData ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />
      
      <Route path="/register" element={
        userData ? <Navigate to="/dashboard" replace /> : <RegisterPage />
      } />
      
      <Route path="/pending" element={<PendingPage />} />
      <Route path="/blocked" element={<BlockedPage />} />
      <Route path="/expired" element={<ExpiredPage />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      } />

      {/* Instructor Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <InstructorLayout />
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
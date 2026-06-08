import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import UserManagement from '../../pages/admin/UserManagement';
import TradeManagement from '../../pages/admin/TradeManagement';
import AssessmentSetup from '../../pages/admin/AssessmentSetup';


// Page title mapping
const pageTitles = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/trades': 'Trade Management',
  '/admin/assessment': 'Assessment Setup',
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Admin Panel';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        isAdmin={true}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Navbar */}
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/trades" element={<TradeManagement />} />
            <Route path="/assessment" element={<AssessmentSetup />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
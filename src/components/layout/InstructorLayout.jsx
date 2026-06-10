import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import InstructorDashboard from '../../pages/instructor/InstructorDashboard';
import BatchManagement from '../../pages/instructor/BatchManagement';
import TraineeManagement from '../../pages/instructor/TraineeManagement';
import MarksEntry from '../../pages/instructor/MarksEntry';
import Reports from '../../pages/instructor/Reports';


// Page title mapping
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/batches': 'Batches',
  '/dashboard/trainees': 'Trainees',
  '/dashboard/marks': 'Marks Entry',
  '/dashboard/reports': 'Reports',
  '/dashboard/profile': 'Profile',
};

const InstructorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const title = pageTitles[location.pathname] || 'Instructor Mitra';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar
        isAdmin={false}
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
            <Route path="/" element={<InstructorDashboard />} />
            <Route path="/batches" element={<BatchManagement />} />
            <Route path="/trainees" element={<TraineeManagement />} />
            <Route path="/marks" element={<MarksEntry />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<div className="text-xl font-bold text-gray-700">Profile — Coming Soon</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
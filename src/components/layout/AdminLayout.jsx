import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../../pages/admin/AdminDashboard';
const AdminLayout = () => (
  <div>
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
    </Routes>
  </div>
);
export default AdminLayout;

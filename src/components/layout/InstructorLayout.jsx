import { Routes, Route } from 'react-router-dom';
import InstructorDashboard from '../../pages/instructor/InstructorDashboard';
const InstructorLayout = () => (
  <div>
    <Routes>
      <Route path="/" element={<InstructorDashboard />} />
    </Routes>
  </div>
);
export default InstructorLayout;

import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const BlockedPage = () => {
  const navigate = useNavigate();
  const { clearUser } = useAuthStore();

  const handleSignOut = async () => {
    await signOutUser();
    clearUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-100 rounded-full opacity-50"></div>
      </div>

      <div className="relative w-full max-w-md text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Blocked
          </h1>

          <p className="text-gray-500 mb-6 leading-relaxed">
            Your account has been blocked by the administrator. You cannot access Instructor Mitra at this time.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 text-sm font-medium">Account Blocked</span>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Need help?</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              If you believe this is a mistake, please contact your ITI administrator or reach out for support.
            </p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © 2024 Instructor Mitra • For Gujarat ITI Instructors
        </p>
      </div>
    </div>
  );
};

export default BlockedPage;
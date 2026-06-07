import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const ExpiredPage = () => {
  const navigate = useNavigate();
  const { userData, clearUser } = useAuthStore();

  const handleSignOut = async () => {
    await signOutUser();
    clearUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center p-4">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full opacity-50"></div>
      </div>

      <div className="relative w-full max-w-md text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-100 rounded-full mb-6">
          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Expired
          </h1>

          <p className="text-gray-500 mb-6 leading-relaxed">
            Your access to Instructor Mitra has expired. Please contact the administrator to renew your access.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-purple-700 text-sm font-medium">Access Expired</span>
          </div>

          {/* User Details */}
          {userData && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account:</span>
                <span className="text-gray-800 font-medium truncate ml-4">{userData.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ITI:</span>
                <span className="text-gray-800 font-medium truncate ml-4">{userData.itiName}</span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-purple-50 rounded-xl p-3 mb-6 text-left">
            <p className="text-purple-700 text-xs leading-relaxed">
              💡 Contact your administrator to renew your access and continue using Instructor Mitra.
            </p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200"
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

export default ExpiredPage;
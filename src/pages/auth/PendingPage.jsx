import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const PendingPage = () => {
  const navigate = useNavigate();
  const { userData, clearUser } = useAuthStore();

  const handleSignOut = async () => {
    await signOutUser();
    clearUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full opacity-50"></div>
      </div>

      <div className="relative w-full max-w-md text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-100 rounded-full mb-6">
          <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100">

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Under Review
          </h1>

          <p className="text-gray-500 mb-6 leading-relaxed">
            Thank you for registering! Your account is currently pending approval from the administrator.
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-amber-700 text-sm font-medium">Pending Approval</span>
          </div>

          {/* User Details */}
          {userData && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-800 font-medium">{userData.displayName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ITI:</span>
                <span className="text-gray-800 font-medium truncate ml-4">{userData.itiName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trade:</span>
                <span className="text-gray-800 font-medium">{userData.tradeName}</span>
              </div>
            </div>
          )}

          {/* Info Steps */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Registration completed successfully</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-600">Waiting for admin approval</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-400">Access granted to platform</p>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 rounded-xl p-3 mb-6 text-left">
            <p className="text-blue-700 text-xs leading-relaxed">
              💡 Please check back after some time. Once approved, you will be able to access all features of Instructor Mitra.
            </p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
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

export default PendingPage;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserProfile } from '../../services/authService';
import { getAllTrades } from '../../services/tradeService';
import { signOutUser } from '../../services/authService';
import useAuthStore from '../../store/authStore';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    itiName: '',
    address: '',
    tradeId: '',
    tradeName: '',
  });

  const navigate = useNavigate();
  const { user, setUserData } = useAuthStore();

  // Load trades on mount
  useEffect(() => {
    const loadTrades = async () => {
      const { trades: fetchedTrades } = await getAllTrades();
      setTrades(fetchedTrades);
      setLoadingTrades(false);
    };
    loadTrades();
  }, []);

  // If no user, redirect to login
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleTradeSelect = (trade) => {
    setFormData(prev => ({
      ...prev,
      tradeId: trade.id,
      tradeName: trade.name,
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.itiName.trim()) {
      setError('Please enter your ITI name');
      return false;
    }
    if (formData.itiName.trim().length < 3) {
      setError('ITI name must be at least 3 characters');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Please enter your address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.tradeId) {
      setError('Please select your trade');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const { userData, error: createError } = await createUserProfile(user, formData);

      if (createError) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      setUserData(userData);
      navigate('/pending');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-50"></div>
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your Instructor Mitra account</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className="w-3"></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-6 text-xs text-gray-500">
          <span className={step === 1 ? 'text-blue-600 font-medium' : ''}>
            Step 1: ITI Details
          </span>
          <span className={step === 2 ? 'text-blue-600 font-medium' : ''}>
            Step 2: Select Trade
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">

          {/* User Info Bar */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1 — ITI Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ITI Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="itiName"
                  value={formData.itiName}
                  onChange={handleChange}
                  placeholder="e.g. Government ITI Ahmedabad"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Location / Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full address of your ITI..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all resize-none"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Next: Select Trade
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* STEP 2 — Select Trade */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Trade <span className="text-red-500">*</span>
                </label>

                {loadingTrades ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading trades...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {trades.map((trade) => (
                      <button
                        key={trade.id}
                        onClick={() => handleTradeSelect(trade)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.tradeId === trade.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium text-sm ${
                              formData.tradeId === trade.id ? 'text-blue-700' : 'text-gray-800'
                            }`}>
                              {trade.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {trade.duration} Year • {trade.subjects.length} Subjects
                            </p>
                          </div>
                          {formData.tradeId === trade.id && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.tradeId}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © 2024 Instructor Mitra • For Gujarat ITI Instructors
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
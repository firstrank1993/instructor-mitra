import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { getActiveBatch } from '../../services/batchService';
import { getTraineeCount } from '../../services/traineeService';
import { formatDate } from '../../lib/utils';

// Stat Card Component
const StatCard = ({ icon, label, value, bgColor, iconBg, textColor, onClick }) => (
  <div
    onClick={onClick}
    className={`${bgColor} rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Quick Action Button
const QuickAction = ({ icon, label, onClick, borderColor, bgHover, iconColor }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${borderColor} ${bgHover} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white`}
  >
    <div className={`w-10 h-10 flex items-center justify-center ${iconColor}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{label}</span>
  </button>
);

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const { activeBatch, setActiveBatch, traineeCount, setTraineeCount } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!userData?.uid) return;
      setLoading(true);
      const { batch } = await getActiveBatch(userData.uid);
      setActiveBatch(batch);
      if (batch) {
        const { count } = await getTraineeCount(batch.id);
        setTraineeCount(count);
      }
      setLoading(false);
    };
    loadDashboard();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Welcome Banner — Dark solid background for clear text */}
      <div style={{background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)'}} className="rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Name — large white bold */}
            <h2 style={{color: '#ffffff', fontSize: '22px', fontWeight: '800', marginBottom: '6px'}}>
              Welcome, {userData?.displayName?.split(' ')[0] || 'Instructor'}! 👋
            </h2>
            {/* ITI Name — light yellow for contrast */}
            <p style={{color: '#fde68a', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
              {userData?.itiName || 'ITI Name'}
            </p>
            {/* Badges */}
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
              <span style={{background: '#ffffff', color: '#1e40af', fontSize: '12px', padding: '4px 12px', borderRadius: '999px', fontWeight: '700'}}>
                {userData?.tradeName || 'Trade'}
              </span>
              {activeBatch && (
                <span style={{background: '#fde68a', color: '#92400e', fontSize: '12px', padding: '4px 12px', borderRadius: '999px', fontWeight: '700'}}>
                  Batch: {activeBatch.batchNumber}
                </span>
              )}
            </div>
          </div>
          {/* Icon Box */}
          <div style={{background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '12px', marginLeft: '16px'}}>
            <svg style={{width: '32px', height: '32px', color: '#ffffff'}} fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </div>

      {/* No Active Batch Warning */}
      {!activeBatch && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-amber-900 font-bold text-sm">No Active Batch</p>
            <p className="text-amber-700 text-xs mt-1">
              Create a batch to start entering marks and generating reports.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/batches')}
            className="bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            Create Batch
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Batch"
          value={activeBatch ? activeBatch.batchNumber : 'None'}
          bgColor="bg-blue-50"
          iconBg="bg-blue-200"
          textColor="text-blue-800"
          icon={
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          onClick={() => navigate('/dashboard/batches')}
        />
        <StatCard
          label="Total Trainees"
          value={traineeCount}
          bgColor="bg-green-50"
          iconBg="bg-green-200"
          textColor="text-green-800"
          icon={
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          onClick={() => navigate('/dashboard/trainees')}
        />
        <StatCard
          label="Year"
          value={activeBatch?.yearOfAssessment || '—'}
          bgColor="bg-purple-50"
          iconBg="bg-purple-200"
          textColor="text-purple-800"
          icon={
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Trade"
          value={userData?.tradeName || '—'}
          bgColor="bg-orange-50"
          iconBg="bg-orange-200"
          textColor="text-orange-800"
          icon={
            <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
      </div>

      {/* Active Batch Details */}
      {activeBatch && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-base">Active Batch Details</h3>
            <button
              onClick={() => navigate('/dashboard/batches')}
              className="text-blue-600 text-sm font-semibold hover:text-blue-800"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Batch Number</p>
              <p className="font-bold text-gray-900 mt-1">{activeBatch.batchNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Year</p>
              <p className="font-bold text-gray-900 mt-1">{activeBatch.yearOfAssessment}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Trainees</p>
              <p className="font-bold text-gray-900 mt-1">{traineeCount}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Created</p>
              <p className="font-bold text-gray-900 mt-1">{formatDate(activeBatch.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            label="Create Batch"
            borderColor="border-blue-300"
            bgHover="hover:bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => navigate('/dashboard/batches')}
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickAction
            label="Add Trainees"
            borderColor="border-green-300"
            bgHover="hover:bg-green-50"
            iconColor="text-green-600"
            onClick={() => navigate('/dashboard/trainees')}
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          />
          <QuickAction
            label="Enter Marks"
            borderColor="border-purple-300"
            bgHover="hover:bg-purple-50"
            iconColor="text-purple-600"
            onClick={() => navigate('/dashboard/marks')}
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <QuickAction
            label="Generate Report"
            borderColor="border-orange-300"
            bgHover="hover:bg-orange-50"
            iconColor="text-orange-600"
            onClick={() => navigate('/dashboard/reports')}
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ITI Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 text-base mb-4">Your ITI Information</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-xs text-gray-500 font-medium">ITI Name</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{userData?.itiName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500 font-medium">Address</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{userData?.address}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InstructorDashboard;
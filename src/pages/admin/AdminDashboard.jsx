import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getUserCounts, getRecentUsers, getPendingUsers } from '../../services/userService';
import { getAllTrades } from '../../services/tradeService';
import { formatDate } from '../../lib/utils';

// Stat Card
const StatCard = ({ label, value, icon, bgColor, textColor, iconBg, onClick }) => (
  <div
    onClick={onClick}
    className={`${bgColor} rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Status Badge
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    approved: 'bg-green-100 text-green-800 border border-green-200',
    blocked: 'bg-red-100 text-red-800 border border-red-200',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${styles[status] || styles.pending}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [tradeCount, setTradeCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      // Load all data in parallel
      const [countsResult, recentResult, pendingResult, tradesResult] = await Promise.all([
        getUserCounts(),
        getRecentUsers(5),
        getPendingUsers(),
        getAllTrades(),
      ]);

      if (countsResult.counts) setCounts(countsResult.counts);
      if (recentResult.users) setRecentUsers(recentResult.users);
      if (pendingResult.users) setPendingUsers(pendingResult.users);
      if (tradesResult.trades) setTradeCount(tradesResult.trades.length);

      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Admin Welcome Banner */}
      <div
        style={{background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'}}
        className="rounded-2xl p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 style={{color: '#ffffff', fontSize: '22px', fontWeight: '800', marginBottom: '6px'}}>
              Admin Panel 👑
            </h2>
            <p style={{color: '#6ee7b7', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
              Welcome, {userData?.displayName?.split(' ')[0] || 'Admin'}
            </p>
            <p style={{color: '#a7f3d0', fontSize: '12px'}}>
              Instructor Mitra Platform Management
            </p>
          </div>
          <div style={{background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '12px'}}>
            <svg style={{width: '32px', height: '32px'}} fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pending Approval Alert */}
      {counts.pending > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-900 font-bold text-sm">
                {counts.pending} Instructor{counts.pending > 1 ? 's' : ''} Waiting for Approval
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                Review and approve pending accounts
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Instructors"
          value={counts.total}
          bgColor="bg-blue-50"
          iconBg="bg-blue-200"
          textColor="text-blue-800"
          onClick={() => navigate('/admin/users')}
          icon={
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Approval"
          value={counts.pending}
          bgColor="bg-amber-50"
          iconBg="bg-amber-200"
          textColor="text-amber-800"
          onClick={() => navigate('/admin/users')}
          icon={
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Users"
          value={counts.approved}
          bgColor="bg-green-50"
          iconBg="bg-green-200"
          textColor="text-green-800"
          icon={
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Trades"
          value={tradeCount}
          bgColor="bg-purple-50"
          iconBg="bg-purple-200"
          textColor="text-purple-800"
          onClick={() => navigate('/admin/trades')}
          icon={
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Users */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Pending Approvals</h3>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-600 text-sm font-semibold hover:text-blue-800"
            >
              View All →
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">All caught up!</p>
              <p className="text-gray-400 text-xs mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => navigate('/admin/users')}
                >
                  <div className="w-9 h-9 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-800 font-bold text-sm">
                      {user.displayName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.itiName}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Recent Registrations</h3>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-600 text-sm font-semibold hover:text-blue-800"
            >
              View All →
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No registrations yet</p>
              <p className="text-gray-400 text-xs mt-1">New instructors will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate('/admin/users')}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-800 font-bold text-sm">
                        {user.displayName?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.tradeName} • {formatDate(user.createdAt)}</p>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">Admin Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Manage Users */}
          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-blue-300 hover:bg-blue-50 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700">Manage Users</span>
          </button>

          {/* Manage Trades */}
          <button
            onClick={() => navigate('/admin/trades')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-purple-300 hover:bg-purple-50 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700">Manage Trades</span>
          </button>

          {/* Assessment Setup */}
          <button
            onClick={() => navigate('/admin/assessment')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-green-300 hover:bg-green-50 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-semibold text-gray-700">Assessment Setup</span>
          </button>

          {/* Platform Stats */}
          <button
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-orange-300 hover:bg-orange-50 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700">Platform Stats</span>
          </button>
        </div>
      </div>

      {/* User Status Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">User Status Summary</h3>
        <div className="space-y-3">
          {/* Approved */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500 font-medium">Approved</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{width: counts.total > 0 ? `${(counts.approved / counts.total) * 100}%` : '0%'}}
              ></div>
            </div>
            <div className="w-8 text-xs font-bold text-green-700">{counts.approved}</div>
          </div>
          {/* Pending */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500 font-medium">Pending</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{width: counts.total > 0 ? `${(counts.pending / counts.total) * 100}%` : '0%'}}
              ></div>
            </div>
            <div className="w-8 text-xs font-bold text-amber-700">{counts.pending}</div>
          </div>
          {/* Blocked */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500 font-medium">Blocked</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{width: counts.total > 0 ? `${(counts.blocked / counts.total) * 100}%` : '0%'}}
              ></div>
            </div>
            <div className="w-8 text-xs font-bold text-red-700">{counts.blocked}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
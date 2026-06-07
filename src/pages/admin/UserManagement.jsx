import { useState, useEffect } from 'react';
import {
  getAllUsers,
  approveUser,
  blockUser,
  updateUserExpiry
} from '../../services/userService';
import { formatDate } from '../../lib/utils';

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

// Toggle Switch Component
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// User Detail Modal
const UserDetailModal = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState(
    user.expiryDate
      ? (user.expiryDate?.toDate?.() || new Date(user.expiryDate))
          .toISOString().split('T')[0]
      : ''
  );
  const [status, setStatus] = useState(user.status);

  const handleToggleApproval = async () => {
    setLoading(true);
    if (status === 'approved') {
      await blockUser(user.id);
      setStatus('blocked');
    } else {
      await approveUser(user.id, expiryDate ? new Date(expiryDate) : null);
      setStatus('approved');
    }
    setLoading(false);
    onUpdate();
  };

  const handleSaveExpiry = async () => {
    setLoading(true);
    await updateUserExpiry(user.id, expiryDate ? new Date(expiryDate) : null);
    setLoading(false);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">User Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* User Avatar + Name */}
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-blue-800 font-bold text-xl">{user.displayName?.[0]}</span>
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-base">{user.displayName}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">ITI Name</span>
              <span className="text-gray-800 font-semibold text-right ml-4">{user.itiName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Trade</span>
              <span className="text-gray-800 font-semibold">{user.tradeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Registered</span>
              <span className="text-gray-800 font-semibold">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Address</span>
              <span className="text-gray-800 font-semibold text-right ml-4 max-w-48">{user.address}</span>
            </div>
          </div>

          {/* Approval Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Account Access</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {status === 'approved' ? 'User can access platform' : 'User cannot access platform'}
              </p>
            </div>
            <Toggle
              checked={status === 'approved'}
              onChange={handleToggleApproval}
              disabled={loading}
            />
          </div>

          {/* Expiry Date */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="font-semibold text-gray-800 text-sm mb-2">Access Expiry Date</p>
            <p className="text-xs text-gray-500 mb-3">Leave empty for no expiry</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveExpiry}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main User Management Page
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    const { users: fetchedUsers } = await getAllUsers();
    const instructors = fetchedUsers.filter(u => u.role === 'instructor');
    setUsers(instructors);
    setFilteredUsers(instructors);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.itiName?.toLowerCase().includes(query) ||
        u.tradeName?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, users]);

  const handleQuickToggle = async (user, e) => {
    e.stopPropagation();
    if (user.status === 'approved') {
      await blockUser(user.id);
    } else {
      await approveUser(user.id);
    }
    loadUsers();
  };

  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    blocked: users.filter(u => u.status === 'blocked').length,
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage instructor accounts and access</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', key: 'all', color: 'bg-blue-50 text-blue-800 border-blue-200' },
          { label: 'Pending', key: 'pending', color: 'bg-amber-50 text-amber-800 border-amber-200' },
          { label: 'Approved', key: 'approved', color: 'bg-green-50 text-green-800 border-green-200' },
          { label: 'Blocked', key: 'blocked', color: 'bg-red-50 text-red-800 border-red-200' },
        ].map(({ label, key, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${color} ${
              statusFilter === key ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <p className="text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs font-semibold mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, ITI or trade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold">No users found</p>
            <p className="text-gray-400 text-sm mt-1">Try changing your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                {/* Avatar */}
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold">{user.displayName?.[0]}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800 text-sm">{user.displayName}</p>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.itiName} • {user.tradeName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                </div>

                {/* Date */}
                <div className="hidden lg:block text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">Registered</p>
                  <p className="text-xs font-semibold text-gray-700">{formatDate(user.createdAt)}</p>
                  {user.expiryDate && (
                    <>
                      <p className="text-xs text-gray-500 mt-1">Expires</p>
                      <p className="text-xs font-semibold text-orange-600">{formatDate(user.expiryDate)}</p>
                    </>
                  )}
                </div>

                {/* Quick Toggle */}
                <div
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Toggle
                    checked={user.status === 'approved'}
                    onChange={(e) => handleQuickToggle(user, e)}
                  />
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs text-gray-500 text-center">
          Showing {filteredUsers.length} of {users.length} instructors
        </p>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            loadUsers();
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
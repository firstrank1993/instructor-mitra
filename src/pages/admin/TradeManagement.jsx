import { useState, useEffect } from 'react';
import {
  getAllTradesAdmin,
  addTrade,
  updateTrade,
  hardDeleteTrade
} from '../../services/tradeService';

// Subject options
const SUBJECT_OPTIONS = [
  { key: 'TP', label: 'Trade Practical (TP)' },
  { key: 'TT', label: 'Trade Theory (TT)' },
  { key: 'ES', label: 'Employability Skills (ES)' },
  { key: 'ED', label: 'Engineering Drawing (ED)' },
  { key: 'WCS', label: 'Workshop Calculation & Science (WCS)' },
];

// Subject Badge
const SubjectBadge = ({ subject }) => {
  const colors = {
    TP: 'bg-blue-100 text-blue-800',
    TT: 'bg-purple-100 text-purple-800',
    ES: 'bg-green-100 text-green-800',
    ED: 'bg-orange-100 text-orange-800',
    WCS: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${colors[subject] || 'bg-gray-100 text-gray-800'}`}>
      {subject}
    </span>
  );
};

// Add/Edit Trade Modal
const TradeModal = ({ trade, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: trade?.name || '',
    duration: trade?.duration || 1,
    subjects: trade?.subjects || ['TP', 'TT', 'ES'],
  });

  const handleSubjectToggle = (subject) => {
    // TP and TT are always required
    if (subject === 'TP' || subject === 'TT') return;

    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Trade name is required');
      return;
    }
    if (formData.name.trim().length < 2) {
      setError('Trade name must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');

    // Always include TP and TT
    const subjects = ['TP', 'TT'];
    if (formData.subjects.includes('ES')) subjects.push('ES');
    if (formData.subjects.includes('ED')) subjects.push('ED');
    if (formData.subjects.includes('WCS')) subjects.push('WCS');

    const data = {
      name: formData.name.trim(),
      duration: Number(formData.duration),
      subjects,
    };

    let result;
    if (trade) {
      result = await updateTrade(trade.id, data);
    } else {
      result = await addTrade(data);
    }

    if (result.error) {
      setError('Failed to save trade. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {trade ? 'Edit Trade' : 'Add New Trade'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Trade Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Electrician, Fitter, Welder..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trade Duration
            </label>
            <div className="flex gap-3">
              {[1, 2].map((year) => (
                <button
                  key={year}
                  onClick={() => setFormData(prev => ({ ...prev, duration: year }))}
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    formData.duration === year
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {year} Year{year > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subjects Assigned
            </label>
            <div className="space-y-2">
              {SUBJECT_OPTIONS.map((subject) => {
                const isSelected = formData.subjects.includes(subject.key);
                const isRequired = subject.key === 'TP' || subject.key === 'TT';

                return (
                  <button
                    key={subject.key}
                    onClick={() => handleSubjectToggle(subject.key)}
                    disabled={isRequired}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isRequired ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <SubjectBadge subject={subject.key} />
                      <span className="text-sm font-medium text-gray-700">
                        {subject.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRequired && (
                        <span className="text-xs text-gray-400">Required</span>
                      )}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              TP and TT are always included. Toggle ES, ED, WCS as needed.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Summary</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600">
                {formData.name || 'Trade Name'} •
              </span>
              <span className="text-xs text-gray-600">
                {formData.duration} Year{formData.duration > 1 ? 's' : ''} •
              </span>
              <span className="text-xs text-gray-600">
                {formData.subjects.length} Subjects:
              </span>
              {formData.subjects.map(s => (
                <SubjectBadge key={s} subject={s} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              trade ? 'Save Changes' : 'Add Trade'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ trade, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Trade?</h3>
      <p className="text-gray-500 text-sm mb-6">
        Are you sure you want to delete <strong>{trade.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// Main Trade Management Page
const TradeManagement = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [deleteTrade, setDeleteTrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTrades = async () => {
    setLoading(true);
    const { trades: fetchedTrades } = await getAllTradesAdmin();
    setTrades(fetchedTrades);
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleDelete = async () => {
    if (!deleteTrade) return;
    await hardDeleteTrade(deleteTrade.id);
    setDeleteTrade(null);
    loadTrades();
  };

  const filteredTrades = trades.filter(trade =>
    trade.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trade Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage ITI trades, duration and subjects
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-3xl font-bold text-blue-800">{trades.length}</p>
          <p className="text-sm text-blue-600 font-medium mt-1">Total Trades</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-3xl font-bold text-green-800">
            {trades.filter(t => t.duration === 1).length}
          </p>
          <p className="text-sm text-green-600 font-medium mt-1">1 Year Trades</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-3xl font-bold text-purple-800">
            {trades.filter(t => t.duration === 2).length}
          </p>
          <p className="text-sm text-purple-600 font-medium mt-1">2 Year Trades</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search trades..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Trades List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold">No trades found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first trade to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700"
            >
              Add First Trade
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Trade Icon */}
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>

                {/* Trade Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800">{trade.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      trade.duration === 2
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {trade.duration} Year{trade.duration > 1 ? 's' : ''}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      trade.isActive !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {trade.subjects?.map(subject => (
                      <SubjectBadge key={subject} subject={subject} />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditTrade(trade)}
                    className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Edit trade"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTrade(trade)}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                    title="Delete trade"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && trades.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Showing {filteredTrades.length} of {trades.length} trades
        </p>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <TradeModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadTrades();
          }}
        />
      )}

      {/* Edit Modal */}
      {editTrade && (
        <TradeModal
          trade={editTrade}
          onClose={() => setEditTrade(null)}
          onSave={() => {
            setEditTrade(null);
            loadTrades();
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteTrade && (
        <DeleteModal
          trade={deleteTrade}
          onClose={() => setDeleteTrade(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default TradeManagement;
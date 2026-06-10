import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import {
  getInstructorBatches,
  createBatch,
  setActiveBatch,
  archiveBatch,
  deleteBatch,
  updateBatch
} from '../../services/batchService';
import { formatDate } from '../../lib/utils';

// Status Badge
const BatchStatusBadge = ({ isActive, status }) => {
  if (isActive) {
    return (
      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-800 border border-green-200">
        Active
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        Archived
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-200">
      Inactive
    </span>
  );
};

// Add/Edit Batch Modal
const BatchModal = ({ batch, onClose, onSave, instructorData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setAsActive, setSetAsActive] = useState(!batch);
  const [formData, setFormData] = useState({
    batchNumber: batch?.batchNumber || '',
    yearOfAssessment: batch?.yearOfAssessment || '',
  });

  const handleSubmit = async () => {
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }

    setLoading(true);
    setError('');

    if (batch) {
      // Update existing
      const { error: updateError } = await updateBatch(batch.id, {
        batchNumber: formData.batchNumber.trim(),
        yearOfAssessment: new Date().getFullYear().toString(),
      });
      if (updateError) {
        setError('Failed to update batch. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // Create new
      const { id, error: createError } = await createBatch({
        instructorId: instructorData.uid,
        tradeId: instructorData.tradeId || '',
        tradeName: instructorData.tradeName || '',
        batchNumber: formData.batchNumber.trim(),
        yearOfAssessment: formData.yearOfAssessment.trim(),
        isActive: setAsActive,
      });

      if (createError) {
        setError('Failed to create batch. Please try again.');
        setLoading(false);
        return;
      }

      // Set as active if chosen
      if (setAsActive && id) {
        await setActiveBatch(instructorData.uid, id);
      }
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
            {batch ? 'Edit Batch' : 'Create New Batch'}
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

          {/* Trade Info */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Trade</p>
            <p className="text-sm font-bold text-blue-800 mt-0.5">
              {instructorData?.tradeName || 'Not assigned'}
            </p>
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                batchNumber: e.target.value
              }))}
              placeholder="e.g. B-2024-01, Batch-1, 2024-A"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Year of Assessment — auto info */}
<div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
  <p className="text-xs text-blue-700 font-medium">
    📅 Year of enrollment will be automatically derived from trainee's Date of Admission when you add trainees.
  </p>
</div>

          {/* Set as Active Toggle (only for new batch) */}
          {!batch && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-800">Set as Active Batch</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Makes this your current working batch
                </p>
              </div>
              <button
                onClick={() => setSetAsActive(!setAsActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  setAsActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  setAsActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              batch ? 'Save Changes' : 'Create Batch'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Batch Management Page
const BatchManagement = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const { activeBatch, setActiveBatch } = useAppStore();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadBatches = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    const { batches: fetchedBatches } = await getInstructorBatches(userData.uid);
    setBatches(fetchedBatches);
    setLoading(false);
  };

  useEffect(() => {
    loadBatches();
  }, [userData]);

  const handleSetActive = async (batch) => {
    setActionLoading(batch.id);
    await setActiveBatch(userData.uid, batch.id);
    // Update app store
    const updatedBatch = { ...batch, isActive: true };
    setActiveBatch(updatedBatch);
    await loadBatches();
    setActionLoading(null);
  };

  const handleArchive = async (batch) => {
    setActionLoading(batch.id);
    await archiveBatch(batch.id);
    await loadBatches();
    setActionLoading(null);
  };

  const handleDelete = async (batch) => {
    if (!window.confirm(`Delete batch "${batch.batchNumber}"? This cannot be undone.`)) return;
    setActionLoading(batch.id);
    await deleteBatch(batch.id);
    await loadBatches();
    setActionLoading(null);
  };

  const activeBatches = batches.filter(b => b.isActive);
  const inactiveBatches = batches.filter(b => !b.isActive);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your training batches
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-3xl font-bold text-blue-800">{batches.length}</p>
          <p className="text-sm text-blue-600 font-medium mt-1">Total Batches</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-3xl font-bold text-green-800">{activeBatches.length}</p>
          <p className="text-sm text-green-600 font-medium mt-1">Active</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-3xl font-bold text-gray-700">{inactiveBatches.length}</p>
          <p className="text-sm text-gray-500 font-medium mt-1">Inactive</p>
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16 px-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">No Batches Yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Create your first batch to start managing trainees and marks.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Create First Batch
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all ${
                batch.isActive
                  ? 'border-green-400 shadow-green-100'
                  : 'border-gray-100'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Batch Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    batch.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${batch.isActive ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">{batch.batchNumber}</h3>
                      <BatchStatusBadge isActive={batch.isActive} status={batch.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Year: {batch.yearOfAssessment} • Trade: {batch.tradeName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created: {formatDate(batch.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">

                {/* Set Active */}
                {!batch.isActive && (
                  <button
                    onClick={() => handleSetActive(batch)}
                    disabled={actionLoading === batch.id}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Set Active
                  </button>
                )}

                {/* View Trainees */}
                <button
                  onClick={() => navigate('/dashboard/trainees')}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Trainees
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditBatch(batch)}
                  className="flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>

                {/* Archive */}
                {batch.isActive && (
                  <button
                    onClick={() => handleArchive(batch)}
                    disabled={actionLoading === batch.id}
                    className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-amber-100 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Archive
                  </button>
                )}

                {/* Delete */}
                {!batch.isActive && (
                  <button
                    onClick={() => handleDelete(batch)}
                    disabled={actionLoading === batch.id}
                    className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 disabled:opacity-50 ml-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}

                {/* Loading indicator */}
                {actionLoading === batch.id && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <BatchModal
          instructorData={userData}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadBatches();
          }}
        />
      )}

      {/* Edit Modal */}
      {editBatch && (
        <BatchModal
          batch={editBatch}
          instructorData={userData}
          onClose={() => setEditBatch(null)}
          onSave={() => {
            setEditBatch(null);
            loadBatches();
          }}
        />
      )}
    </div>
  );
};

export default BatchManagement;
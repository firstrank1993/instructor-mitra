import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import {
  getBatchTrainees,
  addTrainee,
  updateTrainee,
  deleteTrainee,
  bulkAddTrainees
} from '../../services/traineeService';
import { getTraineeCount } from '../../services/traineeService';
import * as XLSX from 'xlsx';

// Add/Edit Trainee Modal
const TraineeModal = ({ trainee, onClose, onSave, batchData, instructorData, nextOrder }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    enrollmentNumber: trainee?.enrollmentNumber || '',
    name: trainee?.name || '',
    fatherName: trainee?.fatherName || '',
    dateOfBirth: trainee?.dateOfBirth || '',
  });

  const handleSubmit = async () => {
    if (!formData.enrollmentNumber.trim()) {
      setError('Enrollment number is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Trainee name is required');
      return;
    }

    setLoading(true);
    setError('');

    if (trainee) {
      const { error: updateError } = await updateTrainee(trainee.id, {
        enrollmentNumber: formData.enrollmentNumber.trim(),
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
      });
      if (updateError) {
        setError('Failed to update trainee.');
        setLoading(false);
        return;
      }
    } else {
      const { error: addError } = await addTrainee({
        batchId: batchData.id,
        instructorId: instructorData.uid,
        tradeId: instructorData.tradeId || '',
        enrollmentNumber: formData.enrollmentNumber.trim(),
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        order: nextOrder,
      });
      if (addError) {
        setError('Failed to add trainee.');
        setLoading(false);
        return;
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
            {trainee ? 'Edit Trainee' : 'Add Trainee'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enrollment Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.enrollmentNumber}
              onChange={(e) => setFormData(p => ({ ...p, enrollmentNumber: e.target.value }))}
              placeholder="e.g. GJ-2024-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trainee Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Full name of trainee"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Father's Name
            </label>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => setFormData(p => ({ ...p, fatherName: e.target.value }))}
              placeholder="Father's full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
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
              trainee ? 'Save Changes' : 'Add Trainee'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Trainee Management Page
const TraineeManagement = () => {
  const { userData } = useAuthStore();
  const { activeBatch, setTraineeCount } = useAppStore();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTrainee, setEditTrainee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const loadTrainees = async () => {
    if (!activeBatch?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { trainees: fetchedTrainees } = await getBatchTrainees(activeBatch.id);
    setTrainees(fetchedTrainees);
    setTraineeCount(fetchedTrainees.length);
    setLoading(false);
  };

  useEffect(() => {
    loadTrainees();
  }, [activeBatch]);

  const handleDelete = async (trainee) => {
    if (!window.confirm(`Delete trainee "${trainee.name}"?`)) return;
    await deleteTrainee(trainee.id);
    loadTrainees();
  };

  // Download Excel Template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Enrollment Number': 'GJ-2024-001',
        'Trainee Name': 'Example Student',
        'Father Name': 'Example Father',
        'Date of Birth': '2005-01-15',
      },
      {
        'Enrollment Number': 'GJ-2024-002',
        'Trainee Name': 'Another Student',
        'Father Name': 'Another Father',
        'Date of Birth': '2005-03-20',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainees');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, 'trainee_upload_template.xlsx');
  };

  // Handle Excel Upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setUploadResult({ success: false, message: 'Excel file is empty' });
            setUploadLoading(false);
            return;
          }

          // Map Excel columns to trainee fields
          const traineesToAdd = jsonData.map((row, index) => ({
            batchId: activeBatch.id,
            instructorId: userData.uid,
            tradeId: userData.tradeId || '',
            enrollmentNumber: String(row['Enrollment Number'] || row['enrollment_number'] || row['EnrollmentNumber'] || '').trim(),
            name: String(row['Trainee Name'] || row['trainee_name'] || row['Name'] || row['name'] || '').trim(),
            fatherName: String(row['Father Name'] || row['father_name'] || row['FatherName'] || '').trim(),
            dateOfBirth: String(row['Date of Birth'] || row['date_of_birth'] || row['DOB'] || '').trim(),
            order: trainees.length + index + 1,
          })).filter(t => t.enrollmentNumber && t.name);

          if (traineesToAdd.length === 0) {
            setUploadResult({
              success: false,
              message: 'No valid trainees found. Check column names in your file.'
            });
            setUploadLoading(false);
            return;
          }

          const { ids, error } = await bulkAddTrainees(traineesToAdd);

          if (error) {
            setUploadResult({ success: false, message: 'Upload failed: ' + error });
          } else {
            setUploadResult({
              success: true,
              message: `Successfully added ${ids.length} trainees!`
            });
            loadTrainees();
          }
        } catch (err) {
          setUploadResult({ success: false, message: 'Failed to read Excel file.' });
        }
        setUploadLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setUploadResult({ success: false, message: 'Something went wrong.' });
      setUploadLoading(false);
    }

    // Reset file input
    e.target.value = '';
  };

  // Download trainee list as Excel
  const downloadTraineeList = () => {
    if (trainees.length === 0) return;

    const data = trainees.map((t, index) => ({
      'Sr. No.': index + 1,
      'Enrollment Number': t.enrollmentNumber,
      'Trainee Name': t.name,
      'Father Name': t.fatherName,
      'Date of Birth': t.dateOfBirth,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainees');
    ws['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
    ];
    XLSX.writeFile(wb, `trainees_${activeBatch?.batchNumber || 'batch'}.xlsx`);
  };

  const filteredTrainees = trainees.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // No active batch
  if (!activeBatch) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16 px-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">No Active Batch</h3>
          <p className="text-gray-500 text-sm">
            Please create and activate a batch first before adding trainees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainees</h1>
          <p className="text-gray-500 text-sm mt-1">
            Batch: <span className="font-semibold text-blue-600">{activeBatch.batchNumber}</span> •
            Year: <span className="font-semibold">{activeBatch.yearOfAssessment}</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Trainee
        </button>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-blue-800">{trainees.length}</p>
          <p className="text-sm text-blue-600 font-medium mt-1">Total Trainees</p>
        </div>
        <div className="flex gap-2">
          {/* Download List */}
          <button
            onClick={downloadTraineeList}
            disabled={trainees.length === 0}
            className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download List
          </button>
        </div>
      </div>

      {/* Excel Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-1">Bulk Upload via Excel</h3>
        <p className="text-gray-500 text-xs mb-4">
          Download the template, fill it and upload to add multiple trainees at once.
        </p>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mb-4 p-3 rounded-xl border ${
            uploadResult.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm font-medium">{uploadResult.message}</p>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template
          </button>

          {/* Upload Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 disabled:opacity-50"
          >
            {uploadLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Excel
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or enrollment number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Trainees List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold">No trainees yet</p>
            <p className="text-gray-400 text-sm mt-1">Add trainees manually or upload Excel file</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Enrollment No.</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3 hidden lg:block">Father's Name</div>
              <div className="col-span-4 lg:col-span-1 text-right">Actions</div>
            </div>

            {filteredTrainees.map((trainee, index) => (
              <div
                key={trainee.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-1">
                  <span className="text-xs text-gray-500 font-medium">{index + 1}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                    {trainee.enrollmentNumber}
                  </span>
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-gray-800">{trainee.name}</p>
                  {trainee.dateOfBirth && (
                    <p className="text-xs text-gray-400">DOB: {trainee.dateOfBirth}</p>
                  )}
                </div>
                <div className="col-span-3 hidden lg:block">
                  <p className="text-sm text-gray-600">{trainee.fatherName || '—'}</p>
                </div>
                <div className="col-span-4 lg:col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditTrainee(trainee)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(trainee)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
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
      {!loading && trainees.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Showing {filteredTrainees.length} of {trainees.length} trainees
        </p>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <TraineeModal
          batchData={activeBatch}
          instructorData={userData}
          nextOrder={trainees.length + 1}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadTrainees();
          }}
        />
      )}

      {/* Edit Modal */}
      {editTrainee && (
        <TraineeModal
          trainee={editTrainee}
          batchData={activeBatch}
          instructorData={userData}
          nextOrder={trainees.length + 1}
          onClose={() => setEditTrainee(null)}
          onSave={() => {
            setEditTrainee(null);
            loadTrainees();
          }}
        />
      )}
    </div>
  );
};

export default TraineeManagement;
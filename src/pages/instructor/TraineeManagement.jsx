import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import {
  getBatchTrainees,
  addTrainee,
  updateTrainee,
  deleteTrainee,
  bulkAddTrainees,
} from '../../services/traineeService';
import * as XLSX from 'xlsx';

// Format date to DD/MM/YYYY display
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  // If already in DD/MM/YYYY format
  if (dateStr.includes('/')) return dateStr;
  // If in YYYY-MM-DD format (from date input)
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// Convert DD/MM/YYYY to YYYY-MM-DD for date input
const toInputFormat = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

// Convert YYYY-MM-DD to DD/MM/YYYY for storage
const toStorageFormat = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ================================================
// ADD / EDIT TRAINEE MODAL
// ================================================
const TraineeModal = ({ trainee, onClose, onSave, batchData, instructorData, nextOrder }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    rollNumber: trainee?.rollNumber || '',
    enrollmentNumber: trainee?.enrollmentNumber || '',
    name: trainee?.name || '',
    dateOfAdmission: toInputFormat(trainee?.dateOfAdmission || ''),
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

    const traineeData = {
      rollNumber: formData.rollNumber.trim(),
      enrollmentNumber: formData.enrollmentNumber.trim(),
      name: formData.name.trim(),
      dateOfAdmission: toStorageFormat(formData.dateOfAdmission),
    };

    if (trainee) {
      const { error: updateError } = await updateTrainee(trainee.id, traineeData);
      if (updateError) {
        setError('Failed to update trainee.');
        setLoading(false);
        return;
      }
    } else {
      const { error: addError } = await addTrainee({
        ...traineeData,
        batchId: batchData.id,
        instructorId: instructorData.uid,
        tradeId: instructorData.tradeId || '',
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

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roll Number
            </label>
            <input
              type="text"
              value={formData.rollNumber}
              onChange={(e) => setFormData(p => ({ ...p, rollNumber: e.target.value }))}
              placeholder="e.g. 1, 2, 3..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Enrollment Number */}
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

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Full name of trainee (including father's name)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter complete name e.g. RAMESH KUMAR PATEL
            </p>
          </div>

          {/* Date of Admission */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Admission
            </label>
            <input
              type="date"
              value={formData.dateOfAdmission}
              onChange={(e) => setFormData(p => ({ ...p, dateOfAdmission: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Will be stored as DD/MM/YYYY. Year of enrollment is derived from this.
            </p>
          </div>
        </div>

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
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (trainee ? 'Save Changes' : 'Add Trainee')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================================
// VIEW MARKS MODAL
// ================================================
const ViewMarksModal = ({ trainee, batchId, onClose }) => {
  const [marks, setMarks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarks();
  }, []);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');

      const snapshot = await getDocs(
        query(
          collection(db, 'marksEntry'),
          where('traineeId', '==', trainee.id),
          where('batchId', '==', batchId)
        )
      );

      const marksData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMarks(marksData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Saved Marks</h3>
            <p className="text-xs text-gray-500 mt-0.5">{trainee.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : marks?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-medium">No marks saved yet</p>
              <p className="text-gray-400 text-sm mt-1">Go to Marks Entry to enter marks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {marks?.map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg">
                      {entry.half}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      entry.entryType === 'case1'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {entry.entryType === 'case1' ? 'Case 1 — Single %' : 'Case 2 — Subject-wise'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {entry.entryType === 'case1' && (
                      <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500">Input Percentage</p>
                        <p className="text-2xl font-bold text-blue-600">{entry.inputMark}%</p>
                      </div>
                    )}

                    {entry.entryType === 'case2' && (
                      <>
                        {entry.tpMarks70 !== null && entry.tpMarks70 !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">TP (out of 70)</p>
                            <p className="text-xl font-bold text-blue-600">{entry.tpMarks70}</p>
                          </div>
                        )}
                        {entry.esMarks !== null && entry.esMarks !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">ES</p>
                            <p className="text-xl font-bold text-green-600">{entry.esMarks}</p>
                          </div>
                        )}
                        {entry.edMarks !== null && entry.edMarks !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">ED (out of 10)</p>
                            <p className="text-xl font-bold text-orange-600">{entry.edMarks}</p>
                          </div>
                        )}
                        {entry.wcsMarks !== null && entry.wcsMarks !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">WCS (out of 10)</p>
                            <p className="text-xl font-bold text-purple-600">{entry.wcsMarks}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="col-span-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500">Total Marks</p>
                      <p className="text-2xl font-bold text-blue-800">{entry.totalMarks} / 100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================================
// MAIN TRAINEE MANAGEMENT PAGE
// ================================================
const TraineeManagement = () => {
  const { userData } = useAuthStore();
  const { activeBatch, setTraineeCount } = useAppStore();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTrainee, setEditTrainee] = useState(null);
  const [viewMarksTrainee, setViewMarksTrainee] = useState(null);
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
        'Roll Number': '1',
        'Enrollment Number': 'GJ-2024-001',
        'Full Name': 'RAMESH KUMAR PATEL',
        'Date of Admission (DD/MM/YYYY)': '15/06/2024',
      },
      {
        'Roll Number': '2',
        'Enrollment Number': 'GJ-2024-002',
        'Full Name': 'SURESH BHAI SHAH',
        'Date of Admission (DD/MM/YYYY)': '15/06/2024',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainees');
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 28 },
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
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          if (jsonData.length === 0) {
            setUploadResult({ success: false, message: 'Excel file is empty' });
            setUploadLoading(false);
            return;
          }

          const traineesToAdd = jsonData.map((row, index) => ({
            batchId: activeBatch.id,
            instructorId: userData.uid,
            tradeId: userData.tradeId || '',
            rollNumber: String(row['Roll Number'] || row['roll_number'] || row['Roll No'] || '').trim(),
            enrollmentNumber: String(row['Enrollment Number'] || row['enrollment_number'] || '').trim(),
            name: String(row['Full Name'] || row['Name'] || row['full_name'] || '').trim(),
            dateOfAdmission: String(row['Date of Admission (DD/MM/YYYY)'] || row['Date of Admission'] || row['date_of_admission'] || '').trim(),
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
    e.target.value = '';
  };

  // Download trainee list
  const downloadTraineeList = () => {
    if (trainees.length === 0) return;
    const data = trainees.map((t, index) => ({
      'Sr. No.': index + 1,
      'Roll Number': t.rollNumber || '',
      'Enrollment Number': t.enrollmentNumber,
      'Full Name': t.name,
      'Date of Admission': t.dateOfAdmission || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainees');
    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 18 },
    ];
    XLSX.writeFile(wb, `trainees_${activeBatch?.batchNumber || 'batch'}.xlsx`);
  };

  const filteredTrainees = trainees.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
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
            Please go to Batches and create or activate a batch first.
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
            Batch: <span className="font-semibold text-blue-600">{activeBatch.batchNumber}</span>
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

      {/* Excel Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-1">Bulk Upload via Excel</h3>
        <p className="text-gray-500 text-xs mb-4">
          Download template → Fill details → Upload to add multiple trainees at once.
        </p>

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
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 disabled:opacity-50"
          >
            {uploadLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {uploadLoading ? 'Uploading...' : 'Upload Excel'}
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
          placeholder="Search by name, enrollment or roll number..."
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
            <p className="text-gray-400 text-sm mt-1">Add trainees manually or upload Excel</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <div className="col-span-1">#</div>
              <div className="col-span-1">Roll</div>
              <div className="col-span-3">Enrollment</div>
              <div className="col-span-4">Full Name</div>
              <div className="col-span-2 hidden lg:block">Admission</div>
              <div className="col-span-3 lg:col-span-1 text-right">Actions</div>
            </div>

            {filteredTrainees.map((trainee, index) => (
              <div
                key={trainee.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <div className="col-span-1">
                  <span className="text-xs text-gray-400">{index + 1}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs font-semibold text-gray-600">
                    {trainee.rollNumber || '—'}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg truncate block">
                    {trainee.enrollmentNumber}
                  </span>
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-gray-800 truncate">{trainee.name}</p>
                </div>
                <div className="col-span-2 hidden lg:block">
                  <p className="text-xs text-gray-500">
                    {formatDateDisplay(trainee.dateOfAdmission) || '—'}
                  </p>
                </div>
                <div className="col-span-3 lg:col-span-1 flex items-center justify-end gap-1">
                  {/* View Marks */}
                  <button
                    onClick={() => setViewMarksTrainee(trainee)}
                    className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                    title="View saved marks"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => setEditTrainee(trainee)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Delete */}
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
          onSave={() => { setShowAddModal(false); loadTrainees(); }}
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
          onSave={() => { setEditTrainee(null); loadTrainees(); }}
        />
      )}

      {/* View Marks Modal */}
      {viewMarksTrainee && (
        <ViewMarksModal
          trainee={viewMarksTrainee}
          batchId={activeBatch.id}
          onClose={() => setViewMarksTrainee(null)}
        />
      )}
    </div>
  );
};

export default TraineeManagement;
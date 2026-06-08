import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getAllTradesAdmin } from '../../services/tradeService';
import {
  getLOsByTradeAndHalf,
  addLO,
  updateLO,
  deleteLO
} from '../../services/loService';
import {
  getPracticalsByLO,
  addPractical,
  updatePractical,
  deletePractical
} from '../../services/practicalService';
import {
  getAllCriteria,
  updateCriteria
} from '../../services/criteriaService';

// Get halves based on trade duration
const getHalves = (duration) => {
  return duration === 2 ? ['H1', 'H2', 'H3', 'H4'] : ['H1', 'H2'];
};

// ================================================
// LO MODAL
// ================================================
const LOModal = ({ lo, onClose, onSave, tradeId, tradeName, half, nextOrder }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    loNumber: lo?.loNumber || nextOrder,
    loName: lo?.loName || '',
  });

  const handleSubmit = async () => {
    if (!formData.loName.trim()) {
      setError('LO name is required');
      return;
    }
    setLoading(true);
    if (lo) {
      await updateLO(lo.id, {
        loNumber: Number(formData.loNumber),
        loName: formData.loName.trim(),
      });
    } else {
      await addLO({
        tradeId,
        tradeName,
        half,
        loNumber: Number(formData.loNumber),
        loName: formData.loName.trim(),
        order: nextOrder,
      });
    }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {lo ? 'Edit Learning Outcome' : 'Add Learning Outcome'}
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
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <span className="font-semibold text-blue-800">Trade:</span>
            <span className="text-blue-700 ml-2">{tradeName}</span>
            <span className="font-semibold text-blue-800 ml-4">Half:</span>
            <span className="text-blue-700 ml-2">{half}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              LO Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1"
              value={formData.loNumber}
              onChange={(e) => setFormData(p => ({ ...p, loNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              LO Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.loName}
              onChange={(e) => setFormData(p => ({ ...p, loName: e.target.value }))}
              placeholder="e.g. Basic Electrical Wiring"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              : lo ? 'Save Changes' : 'Add LO'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================================
// PRACTICAL MODAL
// ================================================
const PracticalModal = ({ practical, onClose, onSave, loId, loName, tradeId, half, nextNumber }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    practicalNumber: practical?.practicalNumber || nextNumber,
    practicalName: practical?.practicalName || '',
  });

  const handleSubmit = async () => {
    if (!formData.practicalName.trim()) {
      setError('Practical name is required');
      return;
    }
    setLoading(true);
    if (practical) {
      await updatePractical(practical.id, {
        practicalNumber: Number(formData.practicalNumber),
        practicalName: formData.practicalName.trim(),
      });
    } else {
      await addPractical({
        tradeId,
        loId,
        loName,
        half,
        practicalNumber: Number(formData.practicalNumber),
        practicalName: formData.practicalName.trim(),
        order: nextNumber,
      });
    }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            {practical ? 'Edit Practical' : 'Add Practical'}
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
          <div className="bg-purple-50 rounded-xl p-3 text-sm">
            <span className="font-semibold text-purple-800">Under LO:</span>
            <span className="text-purple-700 ml-2">{loName}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Practical Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1"
              value={formData.practicalNumber}
              onChange={(e) => setFormData(p => ({ ...p, practicalNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Practical Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.practicalName}
              onChange={(e) => setFormData(p => ({ ...p, practicalName: e.target.value }))}
              placeholder="e.g. House Wiring with Switch Board"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              : practical ? 'Save Changes' : 'Add Practical'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================================
// EXCEL UPLOAD FOR LOs AND PRACTICALS
// ================================================
const LOExcelUpload = ({ tradeId, tradeName, half, onUploadComplete }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const data = [
      {
        'LO Number': 1,
        'LO Name': 'Basic Electrical Safety',
        'Practical Number': 1,
        'Practical Name': 'Identification of Electrical Tools',
      },
      {
        'LO Number': 1,
        'LO Name': 'Basic Electrical Safety',
        'Practical Number': 2,
        'Practical Name': 'Safety Equipment Usage',
      },
      {
        'LO Number': 2,
        'LO Name': 'House Wiring',
        'Practical Number': 3,
        'Practical Name': 'Single Phase Wiring',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LOs');
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 40 }];
    XLSX.writeFile(wb, `lo_template_${tradeName}_${half}.xlsx`);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          setResult({ success: false, message: 'File is empty' });
          setUploading(false);
          return;
        }

        // Group rows by LO Number
        const loMap = {};
        for (const row of rows) {
          const loNum = Number(row['LO Number'] || 0);
          const loName = String(row['LO Name'] || '').trim();
          const pNum = Number(row['Practical Number'] || 0);
          const pName = String(row['Practical Name'] || '').trim();
          if (!loNum || !loName) continue;
          if (!loMap[loNum]) {
            loMap[loNum] = { loNumber: loNum, loName, practicals: [] };
          }
          if (pNum && pName) {
            loMap[loNum].practicals.push({
              practicalNumber: pNum,
              practicalName: pName,
            });
          }
        }

        let losSaved = 0;
        let practicalsSaved = 0;

        for (const loData of Object.values(loMap)) {
          const { id: loId } = await addLO({
            tradeId,
            tradeName,
            half,
            loNumber: loData.loNumber,
            loName: loData.loName,
            order: loData.loNumber,
          });
          if (loId) {
            losSaved++;
            for (const p of loData.practicals) {
              await addPractical({
                tradeId,
                loId,
                loName: loData.loName,
                half,
                practicalNumber: p.practicalNumber,
                practicalName: p.practicalName,
                order: p.practicalNumber,
              });
              practicalsSaved++;
            }
          }
        }

        setResult({
          success: true,
          message: `Added ${losSaved} LOs and ${practicalsSaved} practicals!`
        });
        onUploadComplete();
      } catch (err) {
        setResult({ success: false, message: 'Failed to process file.' });
      }
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <p className="text-sm font-bold text-blue-800 mb-1">
        📥 Bulk Upload LOs & Practicals via Excel
      </p>
      <p className="text-xs text-blue-600 mb-3">
        Download template → Fill LOs and Practicals → Upload
      </p>
      {result && (
        <div className={`mb-3 p-2 rounded-xl text-xs font-medium ${
          result.success
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {result.message}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Template
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
        >
          {uploading
            ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
          }
          {uploading ? 'Uploading...' : 'Upload Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

// ================================================
// LO CARD WITH PRACTICALS
// ================================================
const LOCard = ({ lo, tradeId, half, onLOUpdated }) => {
  const [practicals, setPracticals] = useState([]);
  const [loadingPracticals, setLoadingPracticals] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAddPractical, setShowAddPractical] = useState(false);
  const [editPractical, setEditPractical] = useState(null);
  const [editLO, setEditLO] = useState(false);

  const loadPracticals = async () => {
    setLoadingPracticals(true);
    const { practicals: fetched } = await getPracticalsByLO(lo.id);
    setPracticals(fetched);
    setLoadingPracticals(false);
  };

  const handleExpand = () => {
    if (!expanded) loadPracticals();
    setExpanded(!expanded);
  };

  const handleDeletePractical = async (practical) => {
    if (!window.confirm(`Delete "${practical.practicalName}"?`)) return;
    await deletePractical(practical.id);
    loadPracticals();
  };

  const handleDeleteLO = async () => {
    if (!window.confirm(`Delete LO "${lo.loName}" and all its practicals?`)) return;
    await deleteLO(lo.id);
    onLOUpdated();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* LO Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={handleExpand}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex-shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
              LO-{lo.loNumber}
            </span>
            <p className="font-semibold text-gray-800 text-sm truncate">{lo.loName}</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {expanded && practicals.length > 0
              ? `${practicals.length} practicals`
              : 'Click arrow to view practicals'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditLO(true)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteLO}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Practicals */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
          {loadingPracticals ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : practicals.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              No practicals yet. Add your first practical below.
            </p>
          ) : (
            practicals.map((practical) => (
              <div
                key={practical.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
              >
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                  P-{practical.practicalNumber}
                </span>
                <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                  {practical.practicalName}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditPractical(practical)}
                    className="p-1 rounded-lg hover:bg-blue-50 text-blue-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePractical(practical)}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setShowAddPractical(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-xs font-semibold hover:bg-purple-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Practical
          </button>
        </div>
      )}

      {/* Edit LO Modal */}
      {editLO && (
        <LOModal
          lo={lo}
          tradeId={tradeId}
          tradeName={lo.tradeName}
          half={half}
          nextOrder={lo.order}
          onClose={() => setEditLO(false)}
          onSave={() => { setEditLO(false); onLOUpdated(); }}
        />
      )}

      {/* Add Practical Modal */}
      {showAddPractical && (
        <PracticalModal
          loId={lo.id}
          loName={lo.loName}
          tradeId={tradeId}
          half={half}
          nextNumber={practicals.length + 1}
          onClose={() => setShowAddPractical(false)}
          onSave={() => { setShowAddPractical(false); loadPracticals(); }}
        />
      )}

      {/* Edit Practical Modal */}
      {editPractical && (
        <PracticalModal
          practical={editPractical}
          loId={lo.id}
          loName={lo.loName}
          tradeId={tradeId}
          half={half}
          nextNumber={practicals.length + 1}
          onClose={() => setEditPractical(null)}
          onSave={() => { setEditPractical(null); loadPracticals(); }}
        />
      )}
    </div>
  );
};

// ================================================
// CRITERIA SECTION
// ================================================
const CriteriaSection = () => {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [editingSubCriteria, setEditingSubCriteria] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCriteria(); }, []);

  const loadCriteria = async () => {
    setLoading(true);
    const { criteria: fetched } = await getAllCriteria();
    setCriteria(fetched);
    setLoading(false);
  };

  const handleSaveCriteria = async (criteriaId, updatedData) => {
    setSaving(true);
    await updateCriteria(criteriaId, updatedData);
    setSaving(false);
    setEditingCriteria(null);
    setEditingSubCriteria(null);
    loadCriteria();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const totalMarks = criteria.reduce((sum, c) => sum + (c.maxMarks || 0), 0);

  return (
    <div className="space-y-3">
      <div className={`border rounded-xl p-3 ${
        totalMarks === 100
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <p className={`text-xs font-medium ${
          totalMarks === 100 ? 'text-green-800' : 'text-amber-800'
        }`}>
          {totalMarks === 100
            ? '✅ Total marks = 100. Criteria are correctly configured.'
            : `⚠️ Current total = ${totalMarks} marks. Should be 100. Please adjust criteria marks.`
          }
        </p>
      </div>

      {criteria.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Criteria Header */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-700 font-bold text-xs">{c.order}</span>
            </div>
            <div className="flex-1">
              {editingCriteria === c.id ? (
                <div className="flex gap-2 flex-wrap">
                  <input
                    defaultValue={c.name}
                    id={`criteria-name-${c.id}`}
                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    defaultValue={c.maxMarks}
                    id={`criteria-marks-${c.id}`}
                    type="number"
                    className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveCriteria(c.id, {
                      name: document.getElementById(`criteria-name-${c.id}`).value,
                      maxMarks: Number(document.getElementById(`criteria-marks-${c.id}`).value),
                    })}
                    disabled={saving}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingCriteria(null)}
                    className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                    {c.maxMarks} marks
                  </span>
                </div>
              )}
            </div>
            {editingCriteria !== c.id && (
              <button
                onClick={() => setEditingCriteria(c.id)}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Sub Criteria */}
          <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
            {c.subCriteria?.map((sub) => (
              <div key={sub.subId} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex-1">
                  {editingSubCriteria === sub.subId ? (
                    <div className="flex gap-2 flex-wrap">
                      <input
                        defaultValue={sub.name}
                        id={`sub-name-${sub.subId}`}
                        className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        defaultValue={sub.maxMarks}
                        id={`sub-marks-${sub.subId}`}
                        type="number"
                        className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const updatedSubCriteria = c.subCriteria.map(s =>
                            s.subId === sub.subId
                              ? {
                                  ...s,
                                  name: document.getElementById(`sub-name-${sub.subId}`).value,
                                  maxMarks: Number(document.getElementById(`sub-marks-${sub.subId}`).value),
                                }
                              : s
                          );
                          handleSaveCriteria(c.id, { subCriteria: updatedSubCriteria });
                        }}
                        className="bg-blue-600 text-white px-2 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSubCriteria(null)}
                        className="bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700">{sub.name}</p>
                      <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-lg">
                        {sub.maxMarks} marks
                      </span>
                    </div>
                  )}
                </div>
                {editingSubCriteria !== sub.subId && (
                  <button
                    onClick={() => setEditingSubCriteria(sub.subId)}
                    className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ================================================
// MAIN ASSESSMENT SETUP PAGE
// ================================================
const AssessmentSetup = () => {
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedHalf, setSelectedHalf] = useState('H1');
  const [los, setLos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLOs, setLoadingLOs] = useState(false);
  const [showAddLO, setShowAddLO] = useState(false);
  const [activeTab, setActiveTab] = useState('los');

  useEffect(() => { loadTrades(); }, []);

  useEffect(() => {
    if (selectedTrade) loadLOs();
  }, [selectedTrade, selectedHalf]);

  const loadTrades = async () => {
    setLoading(true);
    const { trades: fetchedTrades } = await getAllTradesAdmin();
    setTrades(fetchedTrades);
    if (fetchedTrades.length > 0) setSelectedTrade(fetchedTrades[0]);
    setLoading(false);
  };

  const loadLOs = async () => {
    if (!selectedTrade) return;
    setLoadingLOs(true);
    const { los: fetchedLOs } = await getLOsByTradeAndHalf(selectedTrade.id, selectedHalf);
    setLos(fetchedLOs);
    setLoadingLOs(false);
  };

  const halves = selectedTrade ? getHalves(selectedTrade.duration) : ['H1', 'H2'];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessment Setup</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage LOs, Practicals and Assessment Criteria
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('los')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'los'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          LOs & Practicals
        </button>
        <button
          onClick={() => setActiveTab('criteria')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'criteria'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Assessment Criteria
        </button>
      </div>

      {/* ============================================ */}
      {/* LOs & Practicals Tab */}
      {/* ============================================ */}
      {activeTab === 'los' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Trade Selector */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Trade
                </label>
                <div className="flex flex-wrap gap-2">
                  {trades.map((trade) => (
                    <button
                      key={trade.id}
                      onClick={() => { setSelectedTrade(trade); setSelectedHalf('H1'); }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedTrade?.id === trade.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {trade.name}
                      <span className="ml-1 text-xs opacity-70">({trade.duration}yr)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Half Selector */}
              {selectedTrade && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Half
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {halves.map((half) => (
                      <button
                        key={half}
                        onClick={() => setSelectedHalf(half)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedHalf === half
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-green-300'
                        }`}
                      >
                        {half}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LOs Section */}
              {selectedTrade && (
                <div className="space-y-3">

                  {/* LOs Header + Add Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {selectedTrade.name} — {selectedHalf}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {los.length} LO{los.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddLO(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add LO
                    </button>
                  </div>

                  {/* Excel Upload */}
                  <LOExcelUpload
                    tradeId={selectedTrade.id}
                    tradeName={selectedTrade.name}
                    half={selectedHalf}
                    onUploadComplete={loadLOs}
                  />

                  {/* LO List */}
                  {loadingLOs ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : los.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 text-center py-12">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-semibold text-sm">
                        No LOs for {selectedTrade.name} / {selectedHalf}
                      </p>
                      <p className="text-gray-400 text-xs mt-1 mb-4">
                        Add manually or upload Excel file above
                      </p>
                      <button
                        onClick={() => setShowAddLO(true)}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
                      >
                        Add First LO
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {los.map((lo) => (
                        <LOCard
                          key={lo.id}
                          lo={lo}
                          tradeId={selectedTrade.id}
                          half={selectedHalf}
                          onLOUpdated={loadLOs}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* Criteria Tab */}
      {/* ============================================ */}
      {activeTab === 'criteria' && <CriteriaSection />}

      {/* Add LO Modal */}
      {showAddLO && selectedTrade && (
        <LOModal
          tradeId={selectedTrade.id}
          tradeName={selectedTrade.name}
          half={selectedHalf}
          nextOrder={los.length + 1}
          onClose={() => setShowAddLO(false)}
          onSave={() => { setShowAddLO(false); loadLOs(); }}
        />
      )}
    </div>
  );
};

export default AssessmentSetup;
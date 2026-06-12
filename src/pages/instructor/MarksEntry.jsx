import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { getBatchTrainees } from '../../services/traineeService';
import { getLOsByTradeAndHalf } from '../../services/loService';
import { getPracticalsByLO } from '../../services/practicalService';
import { getAllCriteria } from '../../services/criteriaService';
import { getTradeById } from '../../services/tradeService';
import { distributeAllTrainees } from '../../utils/marksDistribution';
import {
  saveMarksEntry,
  saveDistributedMarks,
  saveESMarks,
  saveEDMarks,
  saveWCSMarks,
  getMarksForBatchHalf,
} from '../../services/marksService';

const HALVES_1YR = ['H1', 'H2'];
const HALVES_2YR = ['H1', 'H2', 'H3', 'H4'];

// Progress Bar Modal
const ProgressBar = ({ progress, message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h3 className="font-bold text-gray-800 mb-2">Saving Marks...</h3>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-blue-600 font-bold text-lg">{progress}%</p>
    </div>
  </div>
);

const MarksEntry = () => {
  const { userData } = useAuthStore();
  const { activeBatch } = useAppStore();

  const [step, setStep] = useState(1);
  const [entryType, setEntryType] = useState(null);
  const [selectedHalf, setSelectedHalf] = useState('H1');
  const [trade, setTrade] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [los, setLos] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [savedHalves, setSavedHalves] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [marksData, setMarksData] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeBatch && userData) {
      loadInitialData();
    }
  }, [activeBatch, selectedHalf]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load trade
      const { trade: tradeData } = await getTradeById(userData.tradeId);
      setTrade(tradeData);

      // Load trainees
      const { trainees: traineeList } = await getBatchTrainees(activeBatch.id);
      setTrainees(traineeList);

      // Load LOs with practicals
      const { los: loList } = await getLOsByTradeAndHalf(userData.tradeId, selectedHalf);
      const losWithPracticals = await Promise.all(
        loList.map(async (lo) => {
          const { practicals } = await getPracticalsByLO(lo.id);
          return { ...lo, practicals };
        })
      );
      setLos(losWithPracticals);

      // Load criteria
      const { criteria: criteriaList } = await getAllCriteria();
      setCriteria(criteriaList);

      // Check already saved halves
      const { marks: existingMarks } = await getMarksForBatchHalf(activeBatch.id, selectedHalf);
      if (existingMarks.length > 0) {
        setSavedHalves(prev => [...new Set([...prev, selectedHalf])]);
      }

      // Initialize marks data
      const initialMarks = {};
      traineeList.forEach(t => {
        initialMarks[t.id] = {
          inputMark: '',
          tpMarks: '',
          esMarks: '',
          edMarks: '',
          wcsMarks: '',
        };
      });
      setMarksData(initialMarks);

    } catch (err) {
      setError('Failed to load data. Please try again.');
    }

    setLoading(false);
  };

  const handleMarkChange = (traineeId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [traineeId]: { ...prev[traineeId], [field]: value }
    }));
  };

  // Derived subject flags
  const has5Subjects = trade?.subjects?.includes('ED') && trade?.subjects?.includes('WCS');
  const has3Subjects = !has5Subjects;

  // ================================================
  // DOWNLOAD MARKS TEMPLATE
  // ================================================
  const downloadMarksTemplate = () => {
    let data;
    if (entryType === 'case1') {
      data = trainees.map(t => ({
        'Enrollment Number': t.enrollmentNumber,
        'Trainee Name': t.name,
        'Marks (0-100)': '',
      }));
    } else if (has5Subjects) {
      data = trainees.map(t => ({
        'Enrollment Number': t.enrollmentNumber,
        'Trainee Name': t.name,
        'TP (0-70)': '',
        'ES (0-10)': '',
        'ED (0-10)': '',
        'WCS (0-10)': '',
      }));
    } else {
      data = trainees.map(t => ({
        'Enrollment Number': t.enrollmentNumber,
        'Trainee Name': t.name,
        'TP (0-70)': '',
        'ES (0-30)': '',
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.writeFile(wb, `marks_template_${selectedHalf}_${entryType}.xlsx`);
  };

  // ================================================
  // HANDLE EXCEL UPLOAD FOR MARKS
  // ================================================
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          setUploadError('Excel file is empty');
          return;
        }

        const newMarksData = { ...marksData };
        let matched = 0;

        for (const row of rows) {
          const enrollment = String(
            row['Enrollment Number'] || row['enrollment_number'] || ''
          ).trim();

          const trainee = trainees.find(t => t.enrollmentNumber === enrollment);
          if (!trainee) continue;

          if (entryType === 'case1') {
            const mark = row['Marks (0-100)'] ?? row['Marks'] ?? '';
            newMarksData[trainee.id] = {
              ...newMarksData[trainee.id],
              inputMark: String(mark),
            };
          } else if (has5Subjects) {
            newMarksData[trainee.id] = {
              ...newMarksData[trainee.id],
              tpMarks: String(row['TP (0-70)'] ?? row['TP'] ?? ''),
              esMarks: String(row['ES (0-10)'] ?? row['ES'] ?? ''),
              edMarks: String(row['ED (0-10)'] ?? row['ED'] ?? ''),
              wcsMarks: String(row['WCS (0-10)'] ?? row['WCS'] ?? ''),
            };
          } else {
            newMarksData[trainee.id] = {
              ...newMarksData[trainee.id],
              tpMarks: String(row['TP (0-70)'] ?? row['TP'] ?? ''),
              esMarks: String(row['ES (0-30)'] ?? row['ES'] ?? ''),
            };
          }
          matched++;
        }

        setMarksData(newMarksData);
        setUploadSuccess(`Marks loaded for ${matched} trainees from Excel!`);
      } catch (err) {
        setUploadError('Failed to read file. Please use the template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ================================================
  // VALIDATE MARKS
  // ================================================
  const validateMarks = () => {
    for (const trainee of trainees) {
      const marks = marksData[trainee.id];
      if (!marks) continue;

      if (entryType === 'case1') {
        const val = Number(marks.inputMark);
        if (marks.inputMark === '' || isNaN(val) || val < 0 || val > 100) {
          setError(`Invalid marks for ${trainee.name}. Enter a value between 0 and 100.`);
          return false;
        }
      } else {
        // Case 2: Each subject validated independently
        const tp = Number(marks.tpMarks);
        if (marks.tpMarks === '' || isNaN(tp) || tp < 0 || tp > 70) {
          setError(`Invalid TP marks for ${trainee.name}. Must be 0 to 70.`);
          return false;
        }

        if (has3Subjects) {
          const es = Number(marks.esMarks);
          if (marks.esMarks === '' || isNaN(es) || es < 0 || es > 30) {
            setError(`Invalid ES marks for ${trainee.name}. Must be 0 to 30.`);
            return false;
          }
        } else {
          const es = Number(marks.esMarks);
          const ed = Number(marks.edMarks);
          const wcs = Number(marks.wcsMarks);
          if (marks.esMarks === '' || isNaN(es) || es < 0 || es > 10) {
            setError(`Invalid ES marks for ${trainee.name}. Must be 0 to 10.`);
            return false;
          }
          if (marks.edMarks === '' || isNaN(ed) || ed < 0 || ed > 10) {
            setError(`Invalid ED marks for ${trainee.name}. Must be 0 to 10.`);
            return false;
          }
          if (marks.wcsMarks === '' || isNaN(wcs) || wcs < 0 || wcs > 10) {
            setError(`Invalid WCS marks for ${trainee.name}. Must be 0 to 10.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  // ================================================
  // SAVE MARKS
  // ================================================
  const handleSaveMarks = async () => {
    setError('');
    setSuccess('');

    if (!validateMarks()) return;

    if (los.length === 0) {
      setError('No LOs found for this half. Please add LOs in Assessment Setup first.');
      return;
    }

    setSaving(true);
    setSaveProgress(0);
    setSaveMessage('Preparing marks distribution...');

    try {
      // Build trainee marks array
      const traineeMarks = trainees.map(t => {
        const marks = marksData[t.id];
        const tpMarks = entryType === 'case2' ? Number(marks.tpMarks) : null;
        const esMarks = entryType === 'case2' ? Number(marks.esMarks) : null;
        const edMarks = entryType === 'case2' && has5Subjects
          ? Number(marks.edMarks) : null;
        const wcsMarks = entryType === 'case2' && has5Subjects
          ? Number(marks.wcsMarks) : null;

        const totalMarks = entryType === 'case1'
          ? Number(marks.inputMark)
          : tpMarks + (esMarks || 0) + (edMarks || 0) + (wcsMarks || 0);

        return {
          traineeId: t.id,
          traineeName: t.name,
          instructorId: userData.uid,
          batchId: activeBatch.id,
          tradeId: userData.tradeId,
          half: selectedHalf,
          entryType,
          inputMark: entryType === 'case1' ? Number(marks.inputMark) : null,
          tpMarks,
          esMarks,
          edMarks,
          wcsMarks,
          totalMarks,
        };
      });

      setSaveProgress(10);
      setSaveMessage('Running marks distribution engine...');

      // Run distribution
      const distributed = distributeAllTrainees(
        traineeMarks,
        los,
        criteria,
        selectedHalf,
        entryType,
        trade?.subjects || []
      );

      setSaveProgress(20);
      setSaveMessage('Saving marks entries...');

      // Save summary entries
      for (const t of distributed) {
        await saveMarksEntry({
          instructorId: userData.uid,
          batchId: activeBatch.id,
          traineeId: t.traineeId,
          tradeId: userData.tradeId,
          half: selectedHalf,
          entryType,
          inputMark: t.inputMark || null,
          tpMarks70: t.tpMarks70 || null,
          esMarks: t.esMarks || null,
          edMarks: t.edMarks || null,
          wcsMarks: t.wcsMarks || null,
          totalMarks: t.totalMarks,
          status: 'saved',
        });
      }

      setSaveProgress(40);
      setSaveMessage('Saving distributed marks to database...');

      // Add metadata to each distributed trainee record
const distributedWithMeta = distributed.map(t => ({
  ...t,
  instructorId: userData.uid,
  batchId: activeBatch.id,
  tradeId: userData.tradeId || '',
  half: selectedHalf,
}));

console.log('Distributed with meta sample:', JSON.stringify(distributedWithMeta[0], null, 2));

// Save detailed distributed marks
await saveDistributedMarks(
  distributedWithMeta,
  (progress) => setSaveProgress(40 + Math.round(progress * 0.4))
);

      setSaveProgress(80);
      setSaveMessage('Saving subject marks...');

      // Save ES marks
      const esData = distributed
        .filter(t => t.esMarks !== null && t.esMarks !== undefined)
        .map(t => ({
          instructorId: userData.uid,
          batchId: activeBatch.id,
          traineeId: t.traineeId,
          traineeName: t.traineeName,
          tradeId: userData.tradeId,
          half: selectedHalf,
          totalESMarks: t.esMarks,
        }));
      if (esData.length > 0) await saveESMarks(esData);

      // Save ED marks
      const edData = distributed
        .filter(t => t.edMarks !== null && t.edMarks !== undefined)
        .map(t => ({
          instructorId: userData.uid,
          batchId: activeBatch.id,
          traineeId: t.traineeId,
          traineeName: t.traineeName,
          tradeId: userData.tradeId,
          half: selectedHalf,
          totalEDMarks: t.edMarks,
        }));
      if (edData.length > 0) await saveEDMarks(edData);

      // Save WCS marks
      const wcsData = distributed
        .filter(t => t.wcsMarks !== null && t.wcsMarks !== undefined)
        .map(t => ({
          instructorId: userData.uid,
          batchId: activeBatch.id,
          traineeId: t.traineeId,
          traineeName: t.traineeName,
          tradeId: userData.tradeId,
          half: selectedHalf,
          totalWCSMarks: t.wcsMarks,
        }));
      if (wcsData.length > 0) await saveWCSMarks(wcsData);

      setSaveProgress(100);
      setSaveMessage('Done!');

      setTimeout(() => {
        setSaving(false);
        setSuccess(`✅ Marks saved for ${trainees.length} trainees in ${selectedHalf}!`);
        setSavedHalves(prev => [...new Set([...prev, selectedHalf])]);
        setStep(1);
        setEntryType(null);
      }, 500);

    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save marks. Please try again.');
      setSaving(false);
    }
  };

  // No active batch screen
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
          <p className="text-gray-500 text-sm">Please create and activate a batch first.</p>
        </div>
      </div>
    );
  }

  const halves = trade?.duration === 2 ? HALVES_2YR : HALVES_1YR;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-gray-500 text-sm mt-1">
          Batch: <span className="font-semibold text-blue-600">{activeBatch.batchNumber}</span> •
          Trade: <span className="font-semibold">{userData?.tradeName}</span>
        </p>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-semibold text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* STEP 1 — Select Half and Entry Type */}
      {/* ============================================ */}
      {step === 1 && (
        <div className="space-y-5">

          {/* Half Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Step 1: Select Half</h3>
            <div className="flex gap-3 flex-wrap">
              {halves.map((half) => (
                <button
                  key={half}
                  onClick={() => setSelectedHalf(half)}
                  className={`px-6 py-3 rounded-xl border-2 font-semibold transition-all ${
                    selectedHalf === half
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {half}
                  {savedHalves.includes(half) && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      ✓ Saved
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Type Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-2">Step 2: Select Entry Method</h3>
            <p className="text-gray-500 text-sm mb-4">
              How do you want to enter marks for your trainees?
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Case 1 */}
              <button
                onClick={() => { setEntryType('case1'); setStep(2); }}
                className="text-left p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mb-3">
                  <span className="font-bold text-blue-700 text-lg">%</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Case 1 — Single Percentage</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Enter one final percentage (0-100) per trainee. System auto-distributes marks
                  across all LOs, practicals, criteria and sub-criteria.
                </p>
                <p className="mt-3 text-blue-600 text-xs font-semibold">Faster ›</p>
              </button>

              {/* Case 2 */}
              <button
                onClick={() => { setEntryType('case2'); setStep(2); }}
                className="text-left p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Case 2 — Subject-wise Marks</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Enter achieved marks for each subject separately.
                  {has3Subjects
                    ? ' TP out of 70, ES out of 30.'
                    : ' TP out of 70, ES/ED/WCS out of 10 each.'}
                </p>
                <p className="mt-3 text-purple-600 text-xs font-semibold">More control ›</p>
              </button>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                los.length > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm text-gray-700">
                {los.length > 0
                  ? `${los.length} LOs with ${los.reduce((sum, lo) => sum + (lo.practicals?.length || 0), 0)} practicals for ${selectedHalf}`
                  : `No LOs for ${selectedHalf}. Add LOs in Assessment Setup first.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                trainees.length > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm text-gray-700">
                {trainees.length > 0
                  ? `${trainees.length} trainees in active batch`
                  : 'No trainees. Add trainees first.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STEP 2 — Enter Marks */}
      {/* ============================================ */}
      {step === 2 && (
        <div className="space-y-5">

          {/* Step Header */}
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <button
              onClick={() => { setStep(1); setEntryType(null); setError(''); }}
              className="p-2 rounded-xl hover:bg-gray-100 flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-gray-800">
                {entryType === 'case1' ? '📊 Case 1: Single Percentage' : '📋 Case 2: Subject-wise Marks'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Half: <strong>{selectedHalf}</strong> •
                Trainees: <strong>{trainees.length}</strong> •
                Trade: <strong>{userData?.tradeName}</strong>
              </p>
            </div>
          </div>

          {/* Subject Info Banner */}
          {entryType === 'case2' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-blue-800 text-sm font-semibold mb-1">
                📌 Enter achieved marks for each subject:
              </p>
              {has3Subjects ? (
                <p className="text-blue-600 text-xs">
                  • <strong>TP</strong> (Trade Practical) — out of <strong>70</strong> marks &nbsp;|&nbsp;
                  • <strong>ES</strong> (Employability Skills) — out of <strong>30</strong> marks
                </p>
              ) : (
                <p className="text-blue-600 text-xs">
                  • <strong>TP</strong> — out of <strong>70</strong> &nbsp;|&nbsp;
                  • <strong>ES</strong> — out of <strong>10</strong> &nbsp;|&nbsp;
                  • <strong>ED</strong> — out of <strong>10</strong> &nbsp;|&nbsp;
                  • <strong>WCS</strong> — out of <strong>10</strong>
                </p>
              )}
            </div>
          )}

          {/* Excel Upload Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h4 className="font-bold text-gray-800 text-sm mb-1">
              📥 Bulk Upload via Excel
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Download template → Fill marks → Upload to load all marks at once.
            </p>

            {uploadError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-xs font-medium">{uploadError}</p>
              </div>
            )}
            {uploadSuccess && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-600 text-xs font-medium">{uploadSuccess}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={downloadMarksTemplate}
                className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Excel
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

          {/* Marks Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Table Header */}
              <div className="grid px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-100"
                style={{ gridTemplateColumns: entryType === 'case1'
                  ? '40px 1fr 1fr 120px'
                  : has5Subjects
                    ? '40px 1fr 1fr 70px 65px 65px 65px'
                    : '40px 1fr 1fr 90px 90px'
                }}
              >
                <div>#</div>
                <div>Trainee Name</div>
                <div>Enrollment No.</div>
                {entryType === 'case1' && <div className="text-center">Marks % (0-100)</div>}
                {entryType === 'case2' && !has5Subjects && (
                  <>
                    <div className="text-center">TP (/70)</div>
                    <div className="text-center">ES (/30)</div>
                  </>
                )}
                {entryType === 'case2' && has5Subjects && (
                  <>
                    <div className="text-center">TP(/70)</div>
                    <div className="text-center">ES(/10)</div>
                    <div className="text-center">ED(/10)</div>
                    <div className="text-center">WCS(/10)</div>
                  </>
                )}
              </div>

              {/* Trainee Rows */}
              <div className="divide-y divide-gray-100">
                {trainees.map((trainee, index) => (
                  <div
                    key={trainee.id}
                    className="grid px-4 py-3 items-center hover:bg-gray-50"
                    style={{ gridTemplateColumns: entryType === 'case1'
                      ? '40px 1fr 1fr 120px'
                      : has5Subjects
                        ? '40px 1fr 1fr 70px 65px 65px 65px'
                        : '40px 1fr 1fr 90px 90px'
                    }}
                  >
                    <div>
                      <span className="text-xs text-gray-400 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate pr-2">
                        {trainee.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg truncate block">
                        {trainee.enrollmentNumber}
                      </span>
                    </div>

                    {/* Case 1 */}
                    {entryType === 'case1' && (
                      <div>
                        <input
                          type="number"
                          min="0" max="100"
                          value={marksData[trainee.id]?.inputMark || ''}
                          onChange={(e) => handleMarkChange(trainee.id, 'inputMark', e.target.value)}
                          placeholder="0-100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Case 2 — 3 Subjects */}
                    {entryType === 'case2' && has3Subjects && (
                      <>
                        <div>
                          <input
                            type="number" min="0" max="70"
                            value={marksData[trainee.id]?.tpMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'tpMarks', e.target.value)}
                            placeholder="0-70"
                            className="w-full px-2 py-2 border border-blue-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number" min="0" max="30"
                            value={marksData[trainee.id]?.esMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'esMarks', e.target.value)}
                            placeholder="0-30"
                            className="w-full px-2 py-2 border border-green-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </>
                    )}

                    {/* Case 2 — 5 Subjects */}
                    {entryType === 'case2' && has5Subjects && (
                      <>
                        <div>
                          <input
                            type="number" min="0" max="70"
                            value={marksData[trainee.id]?.tpMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'tpMarks', e.target.value)}
                            placeholder="/70"
                            className="w-full px-1 py-2 border border-blue-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number" min="0" max="10"
                            value={marksData[trainee.id]?.esMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'esMarks', e.target.value)}
                            placeholder="/10"
                            className="w-full px-1 py-2 border border-green-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number" min="0" max="10"
                            value={marksData[trainee.id]?.edMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'edMarks', e.target.value)}
                            placeholder="/10"
                            className="w-full px-1 py-2 border border-orange-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number" min="0" max="10"
                            value={marksData[trainee.id]?.wcsMarks || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'wcsMarks', e.target.value)}
                            placeholder="/10"
                            className="w-full px-1 py-2 border border-red-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={() => { setStep(1); setEntryType(null); setError(''); }}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200"
            >
              ← Back
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Marks for {selectedHalf}
            </button>
          </div>
        </div>
      )}

      {/* Save Progress Modal */}
      {saving && <ProgressBar progress={saveProgress} message={saveMessage} />}

    </div>
  );
};

export default MarksEntry;
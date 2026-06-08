import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { getBatchTrainees } from '../../services/traineeService';
import { getLOsByTradeAndHalf } from '../../services/loService';
import { getPracticalsByLO } from '../../services/practicalService';
import { getAllCriteria } from '../../services/criteriaService';
import { getTradeById } from '../../services/tradeService';
import {
  distributeAllTrainees,
} from '../../utils/marksDistribution';
import {
  saveMarksEntry,
  saveDistributedMarks,
  saveESMarks,
  saveEDMarks,
  saveWCSMarks,
  getMarksForBatchHalf,
} from '../../services/marksService';

// Half selector
const HALVES_1YR = ['H1', 'H2'];
const HALVES_2YR = ['H1', 'H2', 'H3', 'H4'];

// Progress Bar
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

  // Marks input state
  const [marksData, setMarksData] = useState({});

  // Load initial data
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

      // Load practicals for each LO
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
      [traineeId]: {
        ...prev[traineeId],
        [field]: value,
      }
    }));
  };

  const validateMarks = () => {
    for (const trainee of trainees) {
      const marks = marksData[trainee.id];
      if (!marks) continue;

      if (entryType === 'case1') {
        const val = Number(marks.inputMark);
        if (marks.inputMark === '' || isNaN(val) || val < 0 || val > 100) {
          setError(`Invalid marks for ${trainee.name}. Must be 0-100.`);
          return false;
        }
      } else {
        const tp = Number(marks.tpMarks);
        if (marks.tpMarks === '' || isNaN(tp) || tp < 0 || tp > 70) {
          setError(`Invalid TP marks for ${trainee.name}. Must be 0-70.`);
          return false;
        }

        const hasES = trade?.subjects?.includes('ES');
        const hasED = trade?.subjects?.includes('ED');
        const hasWCS = trade?.subjects?.includes('WCS');

        if (hasES && !hasED) {
          // 3 subject trade
          const es = Number(marks.esMarks);
          if (marks.esMarks === '' || isNaN(es) || es < 0 || es > 30) {
            setError(`Invalid ES marks for ${trainee.name}. Must be 0-30.`);
            return false;
          }
          if (tp + es !== 100) {
            setError(`Total marks for ${trainee.name} must be 100. Got ${tp + es}.`);
            return false;
          }
        } else if (hasED && hasWCS) {
          // 5 subject trade
          const es = Number(marks.esMarks);
          const ed = Number(marks.edMarks);
          const wcs = Number(marks.wcsMarks);
          if (es < 0 || es > 10 || ed < 0 || ed > 10 || wcs < 0 || wcs > 10) {
            setError(`Subject marks for ${trainee.name} must be 0-10 each.`);
            return false;
          }
          if (tp + es + ed + wcs !== 100) {
            setError(`Total marks for ${trainee.name} must be 100. Got ${tp + es + ed + wcs}.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSaveMarks = async () => {
    setError('');
    setSuccess('');

    if (!validateMarks()) return;
    if (los.length === 0) {
      setError('No LOs found for this trade and half. Please add LOs first.');
      return;
    }

    setSaving(true);
    setSaveProgress(0);
    setSaveMessage('Preparing marks distribution...');

    try {
      // Prepare trainee marks array
      const traineeMarks = trainees.map(t => {
        const marks = marksData[t.id];
        return {
          traineeId: t.id,
          traineeName: t.name,
          instructorId: userData.uid,
          batchId: activeBatch.id,
          tradeId: userData.tradeId,
          half: selectedHalf,
          entryType,
          inputMark: entryType === 'case1' ? Number(marks.inputMark) : null,
          tpMarks: entryType === 'case2' ? Number(marks.tpMarks) : null,
          esMarks: entryType === 'case2' ? Number(marks.esMarks) : null,
          edMarks: entryType === 'case2' && trade?.subjects?.includes('ED')
            ? Number(marks.edMarks) : null,
          wcsMarks: entryType === 'case2' && trade?.subjects?.includes('WCS')
            ? Number(marks.wcsMarks) : null,
        };
      });

      setSaveMessage('Running marks distribution engine...');
      setSaveProgress(10);

      // Run distribution engine
      const distributed = distributeAllTrainees(
        traineeMarks,
        los,
        criteria,
        selectedHalf,
        entryType,
        trade?.subjects || []
      );

      setSaveMessage('Saving marks entries...');
      setSaveProgress(20);

      // Save marks entries (summary)
      for (const trainee of distributed) {
        await saveMarksEntry({
          instructorId: userData.uid,
          batchId: activeBatch.id,
          traineeId: trainee.traineeId,
          tradeId: userData.tradeId,
          half: selectedHalf,
          entryType,
          inputMark: trainee.inputMark || null,
          tpMarks70: trainee.tpMarks70 || null,
          esMarks: trainee.esMarks || null,
          edMarks: trainee.edMarks || null,
          wcsMarks: trainee.wcsMarks || null,
          totalMarks: trainee.totalMarks,
          status: 'saved',
        });
      }

      setSaveProgress(40);
      setSaveMessage('Saving distributed marks...');

      // Save distributed marks (detailed)
      await saveDistributedMarks(
        distributed,
        (progress) => {
          setSaveProgress(40 + Math.round(progress * 0.4));
        }
      );

      setSaveProgress(80);
      setSaveMessage('Saving subject marks...');

      // Save ES marks
      const esData = distributed
        .filter(t => t.esMarks !== null)
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
        .filter(t => t.edMarks !== null)
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
        .filter(t => t.wcsMarks !== null)
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
        setSuccess(`Marks saved successfully for ${trainees.length} trainees in ${selectedHalf}!`);
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
          <p className="text-gray-500 text-sm">Please create and activate a batch first.</p>
        </div>
      </div>
    );
  }

  const halves = trade?.duration === 2 ? HALVES_2YR : HALVES_1YR;
  const has3Subjects = trade?.subjects?.includes('TP') &&
    !trade?.subjects?.includes('ED');
  const has5Subjects = trade?.subjects?.includes('ED') &&
    trade?.subjects?.includes('WCS');

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

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* STEP 1 — Select Half and Entry Type */}
      {step === 1 && (
        <div className="space-y-5">

          {/* Half Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Select Half</h3>
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
                      Saved
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Type Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-2">Select Marks Entry Method</h3>
            <p className="text-gray-500 text-sm mb-4">
              Choose how you want to enter marks for your trainees.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Case 1 */}
              <button
                onClick={() => {
                  setEntryType('case1');
                  setStep(2);
                }}
                className="text-left p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mb-3">
                  <span className="font-bold text-blue-700">%</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Case 1 — Single Percentage</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Enter one final percentage (0-100) per trainee.
                  System automatically distributes marks across all LOs,
                  practicals, criteria and sub-criteria.
                </p>
                <div className="mt-3 flex items-center gap-1 text-blue-600 text-xs font-semibold">
                  <span>Faster entry</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Case 2 */}
              <button
                onClick={() => {
                  setEntryType('case2');
                  setStep(2);
                }}
                className="text-left p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Case 2 — Subject-wise Marks</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Enter marks for each subject separately.
                  {has3Subjects ? ' TP (out of 70) + ES (out of 30) = 100.' : ''}
                  {has5Subjects ? ' TP (70) + ES (10) + ED (10) + WCS (10) = 100.' : ''}
                </p>
                <div className="mt-3 flex items-center gap-1 text-purple-600 text-xs font-semibold">
                  <span>More control</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* LOs Info */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${los.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium text-gray-700">
                {los.length > 0
                  ? `${los.length} LOs found for ${userData?.tradeName} / ${selectedHalf} with ${
                      los.reduce((sum, lo) => sum + (lo.practicals?.length || 0), 0)
                    } practicals`
                  : `No LOs found for ${selectedHalf}. Please add LOs in Assessment Setup first.`
                }
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-3 h-3 rounded-full ${trainees.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium text-gray-700">
                {trainees.length > 0
                  ? `${trainees.length} trainees in active batch`
                  : 'No trainees found. Please add trainees first.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — Enter Marks */}
      {step === 2 && (
        <div className="space-y-5">

          {/* Step Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep(1); setEntryType(null); }}
              className="p-2 rounded-xl hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-gray-800">
                {entryType === 'case1' ? 'Case 1: Single Percentage' : 'Case 2: Subject-wise Marks'}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedHalf} • {trainees.length} Trainees
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Marks Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Table Header */}
                <div className={`grid gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 ${
                  entryType === 'case1'
                    ? 'grid-cols-12'
                    : has5Subjects ? 'grid-cols-12' : 'grid-cols-12'
                }`}>
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Trainee</div>
                  <div className="col-span-3">Enrollment No.</div>
                  {entryType === 'case1' && (
                    <div className="col-span-4 text-center">Marks % (0-100)</div>
                  )}
                  {entryType === 'case2' && !has5Subjects && (
                    <>
                      <div className="col-span-2 text-center">TP (/70)</div>
                      <div className="col-span-2 text-center">ES (/30)</div>
                    </>
                  )}
                  {entryType === 'case2' && has5Subjects && (
                    <>
                      <div className="col-span-1 text-center">TP(/70)</div>
                      <div className="col-span-1 text-center">ES(/10)</div>
                      <div className="col-span-1 text-center">ED(/10)</div>
                      <div className="col-span-1 text-center">WCS(/10)</div>
                    </>
                  )}
                </div>

                {/* Trainee Rows */}
                <div className="divide-y divide-gray-100">
                  {trainees.map((trainee, index) => (
                    <div
                      key={trainee.id}
                      className={`grid gap-2 px-4 py-3 items-center hover:bg-gray-50 ${
                        entryType === 'case1'
                          ? 'grid-cols-12'
                          : has5Subjects ? 'grid-cols-12' : 'grid-cols-12'
                      }`}
                    >
                      <div className="col-span-1">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-semibold text-gray-800 truncate">{trainee.name}</p>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg truncate block">
                          {trainee.enrollmentNumber}
                        </span>
                      </div>

                      {/* Case 1 Input */}
                      {entryType === 'case1' && (
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marksData[trainee.id]?.inputMark || ''}
                            onChange={(e) => handleMarkChange(trainee.id, 'inputMark', e.target.value)}
                            placeholder="0-100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Case 2 — 3 Subject Trade */}
                      {entryType === 'case2' && !has5Subjects && (
                        <>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              value={marksData[trainee.id]?.tpMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'tpMarks', e.target.value)}
                              placeholder="0-70"
                              className="w-full px-2 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={marksData[trainee.id]?.esMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'esMarks', e.target.value)}
                              placeholder="0-30"
                              className="w-full px-2 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </>
                      )}

                      {/* Case 2 — 5 Subject Trade */}
                      {entryType === 'case2' && has5Subjects && (
                        <>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              value={marksData[trainee.id]?.tpMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'tpMarks', e.target.value)}
                              placeholder="/70"
                              className="w-full px-1 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={marksData[trainee.id]?.esMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'esMarks', e.target.value)}
                              placeholder="/10"
                              className="w-full px-1 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={marksData[trainee.id]?.edMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'edMarks', e.target.value)}
                              placeholder="/10"
                              className="w-full px-1 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={marksData[trainee.id]?.wcsMarks || ''}
                              onChange={(e) => handleMarkChange(trainee.id, 'wcsMarks', e.target.value)}
                              placeholder="/10"
                              className="w-full px-1 py-2 border border-gray-300 rounded-xl text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setEntryType(null); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveMarks}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Marks for {selectedHalf}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Save Progress Modal */}
      {saving && (
        <ProgressBar
          progress={saveProgress}
          message={saveMessage}
        />
      )}
    </div>
  );
};

export default MarksEntry;
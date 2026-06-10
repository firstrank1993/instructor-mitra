import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { getBatchTrainees } from '../../services/traineeService';
import { getTradeById } from '../../services/tradeService';
import {
  getDistributedMarksForReport,
  getESMarksForReport,
  getEDMarksForReport,
  getWCSMarksForReport,
} from '../../services/reportsService';
import { generateFAR1Excel } from '../../utils/far1Generator';
import { generateSubjectReport } from '../../utils/far2Generator';

const HALVES_1YR = ['H1', 'H2'];
const HALVES_2YR = ['H1', 'H2', 'H3', 'H4'];

// Report Card
const ReportCard = ({
  title,
  subtitle,
  icon,
  color,
  available,
  onDownloadExcel,
  loading,
}) => (
  <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${
    available ? 'border-gray-200' : 'border-gray-100 opacity-60'
  }`}>
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        {!available && (
          <p className="text-xs text-red-500 mt-1 font-medium">
            No marks saved for this report
          </p>
        )}
      </div>
    </div>

    {available && (
      <div className="flex gap-2 mt-4">
        <button
          onClick={onDownloadExcel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          )}
          Download Excel
        </button>
      </div>
    )}
  </div>
);

const Reports = () => {
  const { userData } = useAuthStore();
  const { activeBatch } = useAppStore();

  const [selectedHalf, setSelectedHalf] = useState('H1');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [trade, setTrade] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Marks availability
  const [hasFAR1, setHasFAR1] = useState(false);
  const [hasES, setHasES] = useState(false);
  const [hasED, setHasED] = useState(false);
  const [hasWCS, setHasWCS] = useState(false);

  // Selected trainees filter
  const [filterTrainee, setFilterTrainee] = useState('all');

  useEffect(() => {
    if (activeBatch && userData) {
      loadData();
    }
  }, [activeBatch, selectedHalf]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const { trade: tradeData } = await getTradeById(userData.tradeId);
      setTrade(tradeData);

      const { trainees: traineeList } = await getBatchTrainees(activeBatch.id);
      setTrainees(traineeList);

      // Check what marks are available
      const { marks: far1Marks } = await getDistributedMarksForReport(activeBatch.id, selectedHalf);
      setHasFAR1(far1Marks.length > 0);

      const { marks: esMarks } = await getESMarksForReport(activeBatch.id, selectedHalf);
      setHasES(esMarks.length > 0);

      const { marks: edMarks } = await getEDMarksForReport(activeBatch.id, selectedHalf);
      setHasED(edMarks.length > 0);

      const { marks: wcsMarks } = await getWCSMarksForReport(activeBatch.id, selectedHalf);
      setHasWCS(wcsMarks.length > 0);

    } catch (err) {
      setError('Failed to load data.');
    }

    setLoading(false);
  };

  // Get filtered trainees
  const getFilteredTrainees = () => {
    if (filterTrainee === 'all') return trainees;
    return trainees.filter(t => t.id === filterTrainee);
  };

  // Generate FAR-1
  const handleFAR1Excel = async () => {
    if (!assessmentDate) {
      setError('Please select assessment date first.');
      return;
    }

    setGeneratingReport('far1');
    setError('');

    try {
      const filteredTrainees = getFilteredTrainees();
      const { marks: distributedMarks } = await getDistributedMarksForReport(activeBatch.id, selectedHalf);

      const wb = generateFAR1Excel({
        trainees: filteredTrainees,
        distributedMarks,
        instructorData: userData,
        batchData: activeBatch,
        half: selectedHalf,
        assessmentDate,
        tradeData: trade,
      });

      const fileName = `FAR1_${activeBatch.batchNumber}_${selectedHalf}_${assessmentDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccess(`FAR-1 report downloaded: ${fileName}`);

    } catch (err) {
      console.error(err);
      setError('Failed to generate FAR-1 report.');
    }

    setGeneratingReport(null);
  };

  // Generate ES Report
  const handleESExcel = async () => {
    if (!assessmentDate) {
      setError('Please select assessment date first.');
      return;
    }

    setGeneratingReport('es');
    setError('');

    try {
      const filteredTrainees = getFilteredTrainees();
      const { marks: esMarks } = await getESMarksForReport(activeBatch.id, selectedHalf);
      const has5Subjects = trade?.subjects?.includes('ED') && trade?.subjects?.includes('WCS');

      const wb = generateSubjectReport({
        trainees: filteredTrainees,
        subjectMarks: esMarks,
        instructorData: userData,
        batchData: activeBatch,
        half: selectedHalf,
        assessmentDate,
        tradeData: trade,
        has5Subjects,
      }, 'ES');

      const fileName = `ES_FAR3_${activeBatch.batchNumber}_${selectedHalf}_${assessmentDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccess(`ES report downloaded: ${fileName}`);

    } catch (err) {
      setError('Failed to generate ES report.');
    }

    setGeneratingReport(null);
  };

  // Generate ED Report
  const handleEDExcel = async () => {
    if (!assessmentDate) {
      setError('Please select assessment date first.');
      return;
    }

    setGeneratingReport('ed');
    setError('');

    try {
      const filteredTrainees = getFilteredTrainees();
      const { marks: edMarks } = await getEDMarksForReport(activeBatch.id, selectedHalf);

      const wb = generateSubjectReport({
        trainees: filteredTrainees,
        subjectMarks: edMarks,
        instructorData: userData,
        batchData: activeBatch,
        half: selectedHalf,
        assessmentDate,
        tradeData: trade,
        has5Subjects: true,
      }, 'ED');

      const fileName = `ED_FAR2_${activeBatch.batchNumber}_${selectedHalf}_${assessmentDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccess(`ED report downloaded: ${fileName}`);

    } catch (err) {
      setError('Failed to generate ED report.');
    }

    setGeneratingReport(null);
  };

  // Generate WCS Report
  const handleWCSExcel = async () => {
    if (!assessmentDate) {
      setError('Please select assessment date first.');
      return;
    }

    setGeneratingReport('wcs');
    setError('');

    try {
      const filteredTrainees = getFilteredTrainees();
      const { marks: wcsMarks } = await getWCSMarksForReport(activeBatch.id, selectedHalf);

      const wb = generateSubjectReport({
        trainees: filteredTrainees,
        subjectMarks: wcsMarks,
        instructorData: userData,
        batchData: activeBatch,
        half: selectedHalf,
        assessmentDate,
        tradeData: trade,
        has5Subjects: true,
      }, 'WCS');

      const fileName = `WCS_FAR2_${activeBatch.batchNumber}_${selectedHalf}_${assessmentDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccess(`WCS report downloaded: ${fileName}`);

    } catch (err) {
      setError('Failed to generate WCS report.');
    }

    setGeneratingReport(null);
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
  const has5Subjects = trade?.subjects?.includes('ED') && trade?.subjects?.includes('WCS');

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
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
          <p className="text-green-700 font-semibold text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-semibold text-sm flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Report Settings</h3>

        {/* Half Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Half
          </label>
          <div className="flex gap-2 flex-wrap">
            {halves.map((half) => (
              <button
                key={half}
                onClick={() => setSelectedHalf(half)}
                className={`px-5 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${
                  selectedHalf === half
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {half}
              </button>
            ))}
          </div>
        </div>

        {/* Assessment Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Assessment <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
          />
        </div>

        {/* Trainee Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Generate For
          </label>
          <select
            value={filterTrainee}
            onChange={(e) => setFilterTrainee(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs bg-white"
          >
            <option value="all">All Trainees ({trainees.length})</option>
            {trainees.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.enrollmentNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Availability Status */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Marks Status for {selectedHalf}:
          </p>
          {[
            { label: 'FAR-1 (Trade Practical)', has: hasFAR1 },
            { label: 'FAR-3 ES (Employability Skills)', has: hasES },
            ...(has5Subjects ? [
              { label: 'FAR-2 ED (Engineering Drawing)', has: hasED },
              { label: 'FAR-2 WCS (Workshop Calc & Science)', has: hasWCS },
            ] : []),
          ].map(({ label, has }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                has ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <p className="text-xs text-gray-600">{label}</p>
              <span className={`text-xs font-semibold ml-auto ${
                has ? 'text-green-600' : 'text-gray-400'
              }`}>
                {has ? '✓ Ready' : '— No marks'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800">Available Reports</h3>

          {/* FAR-1 */}
          <ReportCard
            title="FAR-1 — Trade Practical"
            subtitle="Internal Assessment for Trade Practical (TP) — A4 Landscape"
            available={hasFAR1}
            loading={generatingReport === 'far1'}
            onDownloadExcel={handleFAR1Excel}
            color="bg-blue-100"
            icon={
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          {/* FAR-3 ES */}
          <ReportCard
            title="FAR-3 Annexure III — Employability Skills"
            subtitle={`Internal Assessment for ES — ${has5Subjects ? 'Out of 10 marks' : 'Out of 30 marks'} — A4 Portrait`}
            available={hasES}
            loading={generatingReport === 'es'}
            onDownloadExcel={handleESExcel}
            color="bg-green-100"
            icon={
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* FAR-2 ED — only if 5 subjects */}
          {has5Subjects && (
            <ReportCard
              title="FAR-2 — Engineering Drawing"
              subtitle="Internal Assessment for ED — Out of 10 marks — A4 Portrait"
              available={hasED}
              loading={generatingReport === 'ed'}
              onDownloadExcel={handleEDExcel}
              color="bg-orange-100"
              icon={
                <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
            />
          )}

          {/* FAR-2 WCS — only if 5 subjects */}
          {has5Subjects && (
            <ReportCard
              title="FAR-2 — Workshop Calculation & Science"
              subtitle="Internal Assessment for WCS — Out of 10 marks — A4 Portrait"
              available={hasWCS}
              loading={generatingReport === 'wcs'}
              onDownloadExcel={handleWCSExcel}
              color="bg-purple-100"
              icon={
                <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
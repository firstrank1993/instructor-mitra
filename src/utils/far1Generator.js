import * as XLSX from 'xlsx';

/**
 * FAR-1 Report Generator
 * One sheet per trainee, A4 Landscape
 */

// Column headers structure
const CRITERIA_HEADERS = [
  // Safety Consciousness (15)
  { name: 'Dress code', max: 2 },
  { name: 'Use PPE', max: 5 },
  { name: 'Apply/practice safety', max: 8 },
  { name: 'Total', max: 15, isTotal: true },
  // Workplace Hygiene (10)
  { name: 'Maintain personal & workplace cleanliness', max: 3 },
  { name: 'Dispose scrap as per standard practice', max: 2 },
  { name: 'Select appropriate material & minimize wastage', max: 5 },
  { name: 'Total', max: 10, isTotal: true },
  // Attendance (10)
  { name: 'Initiative', max: 3 },
  { name: 'Accountability', max: 3 },
  { name: 'Participative in work', max: 4 },
  { name: 'Total', max: 10, isTotal: true },
  // Ability to follow Manuals (5)
  { name: 'Select right manual', max: 1 },
  { name: 'Search for appropriate topic', max: 2 },
  { name: 'Read & interpret the manual', max: 2 },
  { name: 'Total', max: 5, isTotal: true },
  // Application of Knowledge (10)
  { name: 'Plan the work', max: 4 },
  { name: 'Select appropriate tools & equipment', max: 3 },
  { name: 'Review the work', max: 3 },
  { name: 'Total', max: 10, isTotal: true },
  // Skills to handle tools (10)
  { name: 'Handle & use tools & equipment', max: 4 },
  { name: 'Maintain safety in handling', max: 3 },
  { name: 'Care & maintain', max: 3 },
  { name: 'Total', max: 10, isTotal: true },
  // Speed (10)
  { name: 'Properly sequence the work', max: 3 },
  { name: 'Use appropriate technique', max: 5 },
  { name: 'Review the work during execution', max: 2 },
  { name: 'Total', max: 10, isTotal: true },
  // Quality (15)
  { name: 'Achieve work with high accuracy', max: 7 },
  { name: 'Conform to requirement', max: 3 },
  { name: 'Satisfy the purpose', max: 5 },
  { name: 'Total', max: 15, isTotal: true },
  // Viva (15)
  { name: 'Response with clarity', max: 7 },
  { name: 'Technical understanding', max: 5 },
  { name: 'Conscious towards job role', max: 3 },
  { name: 'Total', max: 15, isTotal: true },
  // Grand Total
  { name: 'Grand Total', max: 100, isGrandTotal: true },
  { name: 'Signature of Trainee', isSign: true },
  { name: 'Signature of SI', isSign: true },
];

const CRITERIA_GROUPS = [
  { name: 'Safety consciousness', cols: 4 },
  { name: 'Workplace hygiene & Economical use of materials', cols: 4 },
  { name: 'Attendance/ Punctuality', cols: 4 },
  { name: 'Ability to follow Manuals/ Written instructions', cols: 4 },
  { name: 'Application of Knowledge', cols: 4 },
  { name: 'Skills to handle tools & equipment', cols: 4 },
  { name: 'Speed in doing work', cols: 4 },
  { name: 'Quality in workmanship', cols: 4 },
  { name: 'VIVA', cols: 4 },
];

/**
 * Build row data for a practical
 * Returns array matching column structure
 */
const buildPracticalRow = (loLabel, practicalNum, criteriaMarks) => {
  const row = [loLabel, practicalNum];

  for (const criteria of criteriaMarks) {
    // Add sub-criteria marks
    for (const sub of criteria.subCriteriaMarks) {
      row.push(sub.allocatedMark);
    }
    // Add criteria total
    row.push(criteria.allocatedMark);
  }

  // Grand total
  const grandTotal = criteriaMarks.reduce((sum, c) => sum + c.allocatedMark, 0);
  row.push(grandTotal);
  row.push(''); // Signature trainee
  row.push(''); // Signature SI

  return row;
};

/**
 * Generate FAR-1 Excel for all trainees
 */
export const generateFAR1Excel = (reportData) => {
  const {
    trainees,
    distributedMarks,
    instructorData,
    batchData,
    half,
    assessmentDate,
    tradeData,
  } = reportData;

  const wb = XLSX.utils.book_new();

  for (const trainee of trainees) {
    // Get distributed marks for this trainee
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );

    if (traineeMarks.length === 0) continue;

    // Group by LO
    const loGroups = {};
    for (const mark of traineeMarks) {
      if (!loGroups[mark.loId]) {
        loGroups[mark.loId] = {
          loId: mark.loId,
          loName: mark.loName,
          loNumber: mark.loNumber,
          loMark: mark.loMark,
          practicals: [],
        };
      }
      loGroups[mark.loId].practicals.push(mark);
    }

    // Sort LOs by number
    const sortedLOs = Object.values(loGroups).sort(
      (a, b) => a.loNumber - b.loNumber
    );

    // Build worksheet data
    const wsData = [];

    // ROW 1: Title
    wsData.push(['Internal Assessment']);

    // ROW 2: Name + Roll No + Year + Sem
    wsData.push([
      'Name of Trainee:', '', '', '',
      trainee.name,
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Roll NO:', '', '',
      trainee.enrollmentNumber || '',
      '', 'Year of Enrollment:', '', '', '', '', '',
      batchData.yearOfAssessment || '',
      '', '', '', 'Sem:', '', '', '',
      half,
    ]);

    // ROW 3: ITI + Date + Batch
    wsData.push([
      'Name of ITI:', '', '', '',
      instructorData.itiName || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Date of Assessment:', '', '', '', '', '', '', '',
      assessmentDate || '',
      '', '', 'Batch:', '', '', '',
      batchData.batchNumber || '',
    ]);

    // ROW 4: Industry + Assessment Location
    wsData.push([
      'Name of the Industry:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Assessment Location:', '', '', '', '', '', '',
      instructorData.address || '',
    ]);

    // ROW 5: Trade + Duration + SI Name
    wsData.push([
      'Trade Name:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Duration of the Trade:', '', '', '', '', '', '',
      tradeData ? `${tradeData.duration} Year` : '',
      '', '', '', 'S.I.Name:', '', '',
      instructorData.displayName || '',
    ]);

    // ROW 6: Criteria group headers
    const groupRow = ['', ''];
    for (const group of CRITERIA_GROUPS) {
      groupRow.push(group.name);
      for (let i = 1; i < group.cols; i++) groupRow.push('');
    }
    groupRow.push('', '', '');
    wsData.push(groupRow);

    // ROW 7: Sub-criteria headers
    wsData.push([
      'Learning Outcome Number',
      'Practical / Professional Skill Number',
      ...CRITERIA_HEADERS.map(h => h.name),
    ]);

    // ROW 8: Max marks
    wsData.push([
      '', '',
      ...CRITERIA_HEADERS.map(h => h.isSign ? '' : (h.max || '')),
    ]);

    // DATA ROWS — per LO
    for (const lo of sortedLOs) {
      // Sort practicals by number
      const sortedPracticals = lo.practicals.sort(
        (a, b) => a.practicalNumber - b.practicalNumber
      );

      for (let i = 0; i < sortedPracticals.length; i++) {
        const practical = sortedPracticals[i];
        const loLabel = i === 0 ? `LO - ${lo.loNumber}` : `LO - ${lo.loNumber}`;

        const row = buildPracticalRow(
          loLabel,
          practical.practicalNumber,
          practical.criteriaMarks
        );
        wsData.push(row);
      }

      // LO Average row
      const avgRow = new Array(42).fill('');
      avgRow[0] = lo.loName;
      avgRow[31] = `Average of LO${lo.loNumber}`;
      avgRow[37] = lo.loMark;
      wsData.push(avgRow);
    }

    // Overall average
    const overallAvg = sortedLOs.length > 0
      ? Math.round(sortedLOs.reduce((sum, lo) => sum + lo.loMark, 0) / sortedLOs.length)
      : 0;
    const overallRow = new Array(42).fill('');
    overallRow[0] = `Average of all LOs`;
    overallRow[37] = overallAvg;
    wsData.push(overallRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // LO Number
      { wch: 10 }, // Practical Number
      { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 8 }, // Safety (4)
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, // Hygiene (4)
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, // Attendance (4)
      { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 8 }, // Manuals (4)
      { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 8 }, // Knowledge (4)
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 8 }, // Tools (4)
      { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 8 }, // Speed (4)
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, // Quality (4)
      { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, // Viva (4)
      { wch: 12 }, { wch: 16 }, { wch: 16 }, // Grand Total + Signs
    ];

    // Sheet name — use trainee name (max 31 chars, Excel limit)
    const sheetName = trainee.name.substring(0, 28).replace(/[\\/*?[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, sheetName || `Trainee_${trainee.enrollmentNumber}`);
  }

  return wb;
};
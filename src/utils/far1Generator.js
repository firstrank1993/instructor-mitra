import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Build one practical data row
 * Returns array of values for all columns
 */
const buildPracticalRow = (loLabel, practicalNum, criteriaMarks) => {
  const row = [loLabel, practicalNum];

  for (const criteria of criteriaMarks) {
    for (const sub of criteria.subCriteriaMarks) {
      row.push(sub.allocatedMark);
    }
    row.push(criteria.allocatedMark); // criteria total
  }

  // Grand total
  const grandTotal = criteriaMarks.reduce((sum, c) => sum + c.allocatedMark, 0);
  row.push(grandTotal);
  row.push(''); // Signature trainee
  row.push(''); // Signature SI

  return row;
};

/**
 * Generate FAR-1 Excel — one sheet per trainee
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
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );

    if (traineeMarks.length === 0) continue;

    // Group marks by LO
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

    const sortedLOs = Object.values(loGroups).sort(
      (a, b) => a.loNumber - b.loNumber
    );

    const wsRows = [];

    // Row 1: Title
    wsRows.push(['Internal Assessment']);

    // Row 2: Trainee info
    wsRows.push([
      'Name of Trainee:', '', '', '',
      trainee.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Roll NO:', '', '',
      trainee.enrollmentNumber || '',
      '', 'Year of Enrollment:', '', '', '', '', '',
      // Get year from first trainee's dateOfAdmission
trainee.dateOfAdmission
  ? trainee.dateOfAdmission.includes('/')
    ? trainee.dateOfAdmission.split('/')[2]
    : trainee.dateOfAdmission.split('-')[0]
  : batchData.yearOfAssessment || '',


      '', '', '', 'Sem:', '', '', '',
      half,
    ]);

    // Row 3: ITI info
    wsRows.push([
      'Name of ITI:', '', '', '',
      instructorData.itiName || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Date of Assessment:', '', '', '', '', '', '', '',
      assessmentDate || '',
      '', '', 'Batch:', '', '', '',
      batchData.batchNumber || '',
    ]);

    // Row 4: Industry info
    wsRows.push([
      'Name of the Industry:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Assessment Location:', '', '', '', '', '', '',
      instructorData.address || '',
    ]);

    // Row 5: Trade info
    wsRows.push([
      'Trade Name:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Duration of the Trade:', '', '', '', '', '', '',
      tradeData ? `${tradeData.duration} Year` : '',
      '', '', '', 'S.I.Name:', '', '',
      instructorData.displayName || '',
    ]);

    // Row 6: Criteria group headers
    wsRows.push([
      '', '',
      'Safety consciousness', '', '', '',
      'Workplace hygiene  & Economical use of materials', '', '', '',
      'Attendance/ Punctuality', '', '', '',
      'Ability to follow Manuals/ Written instructions', '', '', '',
      'Application of Knowledge', '', '', '',
      'Skills to handle tools & equipment', '', '', '',
      'Speed in doing work', '', '', '',
      'Quality in workmanship', '', '', '',
      'VIVA', '', '', '',
      '', '', '',
    ]);

    // Row 7: Sub-criteria headers
    wsRows.push([
      'Learning Outcome Number',
      'Practical /   Professional Skill Number',
      // Safety (3 sub + total)
      'Dress code', 'Use PPE', 'Apply/practice safety', 'Total',
      // Hygiene (3 sub + total)
      'Maintain personal &   workplace cleanliness',
      'Dispose scrap as per   standard practice',
      'Select appropriate material   &  minimize wastage', 'Total',
      // Attendance (3 sub + total)
      'Initiative', 'Accountability', 'Participative in work', 'Total',
      // Manuals (3 sub + total)
      'Select right manual', 'Search for appropriate topic', 'Read & interpret the manual', 'Total',
      // Knowledge (3 sub + total)
      'Plan the work', 'Select appropriate tools  & equipment', 'Review the work', 'Total',
      // Tools (3 sub + total)
      'Handle & use tools &   equipment', 'Maintain safety in handling', 'Care & maintain', 'Total',
      // Speed (3 sub + total)
      'Properly sequence the work', 'Use appropriate   technique', 'Review the work   during execution', 'Total',
      // Quality (3 sub + total)
      'Achieve work   with high accuracy', 'Conform to requirement', 'Satisfy the purpose', 'Total',
      // Viva (3 sub + total)
      'Response with clarity', 'Technical understanding', 'Conscious towards job role', 'Total',
      // Final
      'Grand Total', 'Signature of Trainee', 'Signature of SI',
    ]);

    // Row 8: Max marks
    wsRows.push([
      '', '',
      2, 5, 8, 15,
      3, 2, 5, 10,
      3, 3, 4, 10,
      1, 2, 2, 5,
      4, 3, 3, 10,
      4, 3, 3, 10,
      3, 5, 2, 10,
      7, 3, 5, 15,
      7, 5, 3, 15,
      100, '', '',
    ]);

    // Data rows per LO
    for (const lo of sortedLOs) {
      const sortedPracticals = lo.practicals.sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );

      for (let i = 0; i < sortedPracticals.length; i++) {
        const practical = sortedPracticals[i];
        const row = buildPracticalRow(
          `LO - ${lo.loNumber}`,
          practical.practicalNumber,
          practical.criteriaMarks || []
        );
        wsRows.push(row);
      }

      // LO average row
      const avgRow = new Array(42).fill('');
      avgRow[0] = lo.loName || '';
      avgRow[31] = `Average of LO${lo.loNumber}`;
      avgRow[37] = lo.loMark || 0;
      wsRows.push(avgRow);
    }

    // Overall average
    const overallAvg = sortedLOs.length > 0
      ? Math.round(sortedLOs.reduce((sum, lo) => sum + (lo.loMark || 0), 0) / sortedLOs.length)
      : 0;

    const overallRow = new Array(42).fill('');
    overallRow[0] = 'Average of all LOs';
    overallRow[37] = overallAvg;
    wsRows.push(overallRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsRows);

    // Column widths
    ws['!cols'] = [
      { wch: 22 }, { wch: 10 },
      { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 8 },
      { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 8 },
      { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 8 },
      { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 8 },
      { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 8 },
      { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 8 },
      { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 8 },
      { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 8 },
      { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 8 },
      { wch: 12 }, { wch: 18 }, { wch: 18 },
    ];

    // Sheet name (Excel limit: 31 chars, no special chars)
    const sheetName = (trainee.name || `T${trainee.enrollmentNumber}`)
      .substring(0, 28)
      .replace(/[\\/*?[\]:]/g, '_')
      .trim();

    XLSX.utils.book_append_sheet(wb, ws, sheetName || `Trainee_${trainee.enrollmentNumber}`);
  }

  return wb;
};

/**
 * Generate FAR-1 PDF — one page per trainee
 */
export const generateFAR1PDF = (reportData) => {
  const {
    trainees,
    distributedMarks,
    instructorData,
    batchData,
    half,
    assessmentDate,
    tradeData,
  } = reportData;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let isFirstPage = true;

  for (const trainee of trainees) {
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );

    if (traineeMarks.length === 0) continue;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

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

    const sortedLOs = Object.values(loGroups).sort((a, b) => a.loNumber - b.loNumber);

    // Header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Internal Assessment', 14, 10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${trainee.name || ''}`, 14, 16);
    doc.text(`Roll No: ${trainee.enrollmentNumber || ''}`, 100, 16);
    doc.text(`Sem: ${half}`, 160, 16);
    doc.text(`Batch: ${batchData.batchNumber || ''}`, 220, 16);
    doc.text(`ITI: ${instructorData.itiName || ''}`, 14, 21);
    doc.text(`Trade: ${tradeData?.name || ''}`, 14, 26);
    doc.text(`Date: ${assessmentDate || ''}`, 100, 21);
    doc.text(`SI: ${instructorData.displayName || ''}`, 160, 21);

    // Build table data
    const tableHead = [[
      'LO', 'P#',
      'Dress\n/2', 'PPE\n/5', 'Safety\n/8', 'C1\n/15',
      'Clean\n/3', 'Scrap\n/2', 'Mat\n/5', 'C2\n/10',
      'Init\n/3', 'Acct\n/3', 'Part\n/4', 'C3\n/10',
      'Man\n/1', 'Search\n/2', 'Read\n/2', 'C4\n/5',
      'Plan\n/4', 'Tools\n/3', 'Rev\n/3', 'C5\n/10',
      'Hndl\n/4', 'Safe\n/3', 'Care\n/3', 'C6\n/10',
      'Seq\n/3', 'Tech\n/5', 'RevEx\n/2', 'C7\n/10',
      'Acc\n/7', 'Conf\n/3', 'Sat\n/5', 'C8\n/15',
      'Resp\n/7', 'Tech\n/5', 'Job\n/3', 'C9\n/15',
      'GT\n/100',
    ]];

    const tableBody = [];

    for (const lo of sortedLOs) {
      const sortedPracticals = lo.practicals.sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );

      for (const practical of sortedPracticals) {
        const row = [`LO-${lo.loNumber}`, practical.practicalNumber];
        let grandTotal = 0;

        for (const criteria of (practical.criteriaMarks || [])) {
          for (const sub of criteria.subCriteriaMarks) {
            row.push(sub.allocatedMark);
          }
          row.push(criteria.allocatedMark);
          grandTotal += criteria.allocatedMark;
        }

        row.push(grandTotal);
        tableBody.push(row);
      }

      // LO average row
      const avgRow = new Array(39).fill('');
      avgRow[0] = lo.loName?.substring(0, 20) || '';
      avgRow[37] = `Avg LO${lo.loNumber}`;
      avgRow[38] = lo.loMark || 0;
      tableBody.push(avgRow);
    }

    // Overall average
    const overallAvg = sortedLOs.length > 0
      ? Math.round(sortedLOs.reduce((sum, lo) => sum + (lo.loMark || 0), 0) / sortedLOs.length)
      : 0;
    const finalRow = new Array(39).fill('');
    finalRow[0] = 'Average of All LOs';
    finalRow[38] = overallAvg;
    tableBody.push(finalRow);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 30,
      styles: { fontSize: 5.5, cellPadding: 1 },
      headStyles: {
        fillColor: [200, 220, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 7 },
      },
      margin: { left: 5, right: 5 },
    });
  }

  return doc;
};
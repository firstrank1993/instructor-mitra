import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * FAR-1 Report Generator — Exact format matching actual report
 * Columns: B=LO, C=Practical, D-G=Safety, H-K=Hygiene, L-O=Attendance,
 * P-S=Manuals, T-W=Knowledge, X-AA=Tools, AB-AE=Speed, AF-AI=Quality,
 * AJ-AM=Viva, AN=GrandTotal, AO=Sign Trainee, AP=Sign SI
 */

const CRITERIA = [
  {
    name: 'Safety consciousness',
    subs: [
      { name: 'Dress code', max: 2 },
      { name: 'Use PPE', max: 5 },
      { name: 'Apply/\npractice\nsafety', max: 8 },
    ],
    total: 15,
  },
  {
    name: 'Workplace hygiene & Economical use of materials',
    subs: [
      { name: 'Maintain\npersonal &\nworkplace\ncleanliness', max: 3 },
      { name: 'Dispose\nscrap as per\nstandard\npractice', max: 2 },
      { name: 'Select\nappropriate\nmaterial &\nminimize\nwastage', max: 5 },
    ],
    total: 10,
  },
  {
    name: 'Attendance/ Punctuality',
    subs: [
      { name: 'Initiative', max: 3 },
      { name: 'Accountability', max: 3 },
      { name: 'Participative\nin work', max: 4 },
    ],
    total: 10,
  },
  {
    name: 'Ability to follow Manuals/ Written instructions',
    subs: [
      { name: 'Select right\nmanual', max: 1 },
      { name: 'Search for\nappropriate\ntopic', max: 2 },
      { name: 'Read &\ninterpret\nthe manual', max: 2 },
    ],
    total: 5,
  },
  {
    name: 'Application of Knowledge',
    subs: [
      { name: 'Plan the\nwork', max: 4 },
      { name: 'Select\nappropriate\ntools &\nequipment', max: 3 },
      { name: 'Review\nthe work', max: 3 },
    ],
    total: 10,
  },
  {
    name: 'Skills to handle tools & equipment',
    subs: [
      { name: 'Handle &\nuse tools &\nequipment', max: 4 },
      { name: 'Maintain\nsafety in\nhandling', max: 3 },
      { name: 'Care &\nmaintain', max: 3 },
    ],
    total: 10,
  },
  {
    name: 'Speed in doing work',
    subs: [
      { name: 'Properly\nsequence\nthe work', max: 3 },
      { name: 'Use\nappropriate\ntechnique', max: 5 },
      { name: 'Review the\nwork during\nexecution', max: 2 },
    ],
    total: 10,
  },
  {
    name: 'Quality in workmanship',
    subs: [
      { name: 'Achieve\nwork with\nhigh\naccuracy', max: 7 },
      { name: 'Conform\nto\nrequirement', max: 3 },
      { name: 'Satisfy\nthe\npurpose', max: 5 },
    ],
    total: 15,
  },
  {
    name: 'VIVA',
    subs: [
      { name: 'Response\nwith\nclarity', max: 7 },
      { name: 'Technical\nunderstanding', max: 5 },
      { name: 'Conscious\ntowards\njob role', max: 3 },
    ],
    total: 15,
  },
];

/**
 * Build one data row for a practical
 * Returns array of 42 values (cols B to AP)
 */
const buildRow = (loLabel, practicalNum, criteriaMarks) => {
  // Col B = LO label, Col C = practical num
  const row = [loLabel, practicalNum];

  let grandTotal = 0;

  for (const criteria of criteriaMarks) {
    // Add each sub-criteria mark
    for (const sub of criteria.subCriteriaMarks) {
      row.push(sub.allocatedMark);
    }
    // Add criteria total
    row.push(criteria.allocatedMark);
    grandTotal += criteria.allocatedMark;
  }

  row.push(grandTotal); // Grand total
  row.push('');         // Sign trainee
  row.push('');         // Sign SI

  return row;
};

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

    // Get year from trainee dateOfAdmission
    const doa = trainee.dateOfAdmission || '';
    let yearOfEnrollment = batchData.yearOfAssessment || '';
    if (doa) {
      if (doa.includes('/')) {
        yearOfEnrollment = doa.split('/')[2] || yearOfEnrollment;
      } else if (doa.includes('-')) {
        yearOfEnrollment = doa.split('-')[0] || yearOfEnrollment;
      }
    }

    // Build worksheet rows
    // NOTE: Actual report starts data in col B (index 1 = col B)
    // So each row array starts with empty string for col A

    const rows = [];

    // Row 1: Title (col B)
    rows.push(['', 'Internal Assessment']);

    // Row 2: Trainee info
    rows.push([
      '',
      'Name of Trainee:', '', '', '',
      trainee.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
      'Roll NO:', '', '',
      trainee.rollNumber || trainee.enrollmentNumber || '',
      '',
      'Year of Enrollment:', '', '', '', '', '',
      yearOfEnrollment,
      '', '', '',
      'Sem:', '', '', '',
      half,
    ]);

    // Row 3: ITI info
    rows.push([
      '',
      'Name of ITI:', '', '', '',
      instructorData.itiName || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
      'Date of Assessment:', '', '', '', '', '', '', '',
      assessmentDate || '',
      '', '',
      'Batch:', '', '', '',
      batchData.batchNumber || '',
    ]);

    // Row 4: Industry
    rows.push([
      '',
      'Name of the Industry:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
      'Assessment Location:', '', '', '', '', '', '',
      instructorData.address || '',
    ]);

    // Row 5: Trade info
    rows.push([
      '',
      'Trade Name:', '', '', '',
      tradeData?.name || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
      'Duration of the Trade:', '', '', '', '', '', '',
      tradeData ? `${tradeData.duration} Year` : '',
      '', '', '',
      'S.I.Name:', '', '',
      instructorData.displayName || '',
    ]);

    // Row 6: Criteria group headers
    // Col A=empty, B=empty, C=empty, then groups start at D
    const groupRow = ['', '', ''];
    for (const criteria of CRITERIA) {
      groupRow.push(criteria.name);
      for (let i = 1; i < criteria.subs.length; i++) groupRow.push('');
      groupRow.push(''); // total col
    }
    groupRow.push(''); // Grand total
    groupRow.push(''); // Sign trainee
    groupRow.push(''); // Sign SI
    rows.push(groupRow);

    // Row 7: Column headers (sub-criteria names)
    const headerRow = [
      '',
      'Learning Outcome Number',
      'Practical /\nProfessional Skill Number',
    ];
    for (const criteria of CRITERIA) {
      for (const sub of criteria.subs) {
        headerRow.push(sub.name);
      }
      headerRow.push('Total');
    }
    headerRow.push('Grand Total');
    headerRow.push('Signature of Trainee');
    headerRow.push('Signature of SI');
    rows.push(headerRow);

    // Row 8: Max marks
    const maxRow = ['', '', ''];
    for (const criteria of CRITERIA) {
      for (const sub of criteria.subs) {
        maxRow.push(sub.max);
      }
      maxRow.push(criteria.total);
    }
    maxRow.push(100);
    maxRow.push('');
    maxRow.push('');
    rows.push(maxRow);

    // Data rows for each LO
    for (const lo of sortedLOs) {
      const sortedPracticals = lo.practicals.sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );

      for (const practical of sortedPracticals) {
        const dataRow = ['', ...buildRow(
          `LO - ${lo.loNumber}`,
          practical.practicalNumber,
          practical.criteriaMarks || []
        )];
        rows.push(dataRow);
      }

      // LO Average row
      const avgRow = new Array(44).fill('');
      avgRow[1] = lo.loName || `LO ${lo.loNumber}`;
      avgRow[32] = `Average of LO${lo.loNumber}`;
      avgRow[39] = lo.loMark || 0;
      rows.push(avgRow);
    }

    // Overall average row
    const overallAvg = sortedLOs.length > 0
      ? Math.round(
          sortedLOs.reduce((s, lo) => s + (lo.loMark || 0), 0) / sortedLOs.length
        )
      : 0;

    const overallRow = new Array(44).fill('');
    overallRow[1] = 'Average of All LOs';
    overallRow[39] = overallAvg;
    rows.push(overallRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths (A through AP)
    ws['!cols'] = [
      { wch: 2 },   // A - empty
      { wch: 18 },  // B - LO Number
      { wch: 8 },   // C - Practical Number
      // Safety (D-G)
      { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 6 },
      // Hygiene (H-K)
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
      // Attendance (L-O)
      { wch: 8 }, { wch: 9 }, { wch: 9 }, { wch: 6 },
      // Manuals (P-S)
      { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
      // Knowledge (T-W)
      { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 6 },
      // Tools (X-AA)
      { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 6 },
      // Speed (AB-AE)
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
      // Quality (AF-AI)
      { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 6 },
      // Viva (AJ-AM)
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 6 },
      // Grand total + signs
      { wch: 10 }, { wch: 14 }, { wch: 14 },
    ];

    // Sheet name — trainee name max 31 chars
    const sheetName = (trainee.name || trainee.enrollmentNumber || 'Trainee')
      .substring(0, 28)
      .replace(/[\\/*?[\]:]/g, '_');

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  return wb;
};

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

  let firstPage = true;

  for (const trainee of trainees) {
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );

    if (traineeMarks.length === 0) continue;

    if (!firstPage) doc.addPage();
    firstPage = false;

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

    const sortedLOs = Object.values(loGroups).sort(
      (a, b) => a.loNumber - b.loNumber
    );

    // Get year from trainee dateOfAdmission
    const doa = trainee.dateOfAdmission || '';
    let yearOfEnrollment = batchData.yearOfAssessment || '';
    if (doa.includes('/')) yearOfEnrollment = doa.split('/')[2] || yearOfEnrollment;
    else if (doa.includes('-')) yearOfEnrollment = doa.split('-')[0] || yearOfEnrollment;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Internal Assessment', 148, 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const y = 13;
    doc.text(`Name of Trainee: ${trainee.name || ''}`, 5, y);
    doc.text(`Roll No: ${trainee.rollNumber || trainee.enrollmentNumber || ''}`, 130, y);
    doc.text(`Year: ${yearOfEnrollment}`, 175, y);
    doc.text(`Sem: ${half}`, 220, y);

    doc.text(`ITI: ${instructorData.itiName || ''}`, 5, y + 4);
    doc.text(`Date: ${assessmentDate || ''}`, 130, y + 4);
    doc.text(`Batch: ${batchData.batchNumber || ''}`, 220, y + 4);

    doc.text(`Industry: ${tradeData?.name || ''}`, 5, y + 8);
    doc.text(`Location: ${instructorData.address || ''}`, 130, y + 8);

    doc.text(`Trade: ${tradeData?.name || ''}`, 5, y + 12);
    doc.text(`Duration: ${tradeData?.duration || ''} Year`, 130, y + 12);
    doc.text(`SI: ${instructorData.displayName || ''}`, 175, y + 12);

    // Table head
    const head = [[
      'LO', 'P#',
      'DC\n/2', 'PPE\n/5', 'Sft\n/8', 'C1\n/15',
      'Cln\n/3', 'Scr\n/2', 'Mat\n/5', 'C2\n/10',
      'Ini\n/3', 'Acc\n/3', 'Par\n/4', 'C3\n/10',
      'Man\n/1', 'Src\n/2', 'Rd\n/2', 'C4\n/5',
      'Pln\n/4', 'Tls\n/3', 'Rev\n/3', 'C5\n/10',
      'Hdl\n/4', 'Sft\n/3', 'Car\n/3', 'C6\n/10',
      'Seq\n/3', 'Tec\n/5', 'REx\n/2', 'C7\n/10',
      'Acc\n/7', 'Cnf\n/3', 'Sat\n/5', 'C8\n/15',
      'Rsp\n/7', 'Tec\n/5', 'Job\n/3', 'C9\n/15',
      'GT\n/100',
    ]];

    const body = [];

    for (const lo of sortedLOs) {
      const sortedPracticals = lo.practicals.sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );

      for (const practical of sortedPracticals) {
        const row = [
          `LO-${lo.loNumber}`,
          practical.practicalNumber,
        ];

        let grandTotal = 0;
        for (const criteria of (practical.criteriaMarks || [])) {
          for (const sub of criteria.subCriteriaMarks) {
            row.push(sub.allocatedMark);
          }
          row.push(criteria.allocatedMark);
          grandTotal += criteria.allocatedMark;
        }
        row.push(grandTotal);
        body.push(row);
      }

      // LO average row
      const avgRow = new Array(40).fill('');
      avgRow[0] = lo.loName?.substring(0, 30) || '';
      avgRow[37] = `Avg LO${lo.loNumber}`;
      avgRow[38] = lo.loMark || 0;
      body.push(avgRow);
    }

    // Overall average
    const overallAvg = sortedLOs.length > 0
      ? Math.round(
          sortedLOs.reduce((s, lo) => s + (lo.loMark || 0), 0) / sortedLOs.length
        )
      : 0;

    const finalRow = new Array(40).fill('');
    finalRow[0] = 'Average of All LOs';
    finalRow[38] = overallAvg;
    body.push(finalRow);

    autoTable(doc, {
      head,
      body,
      startY: y + 17,
      styles: {
        fontSize: 5,
        cellPadding: 0.8,
        valign: 'middle',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [198, 239, 206],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 5,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'left' },
        1: { cellWidth: 7 },
      },
      margin: { left: 3, right: 3 },
      tableWidth: 'auto',
    });
  }

  return doc;
};
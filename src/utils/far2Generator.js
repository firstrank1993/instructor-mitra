import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Random int between min and max inclusive
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Distribute subject marks into sub-components
 * Components: B(Attendance) + C(Speed) + D(Creative) + E(Q1) + F(Q2) = Total out of 60
 * B: 2-5, C: 2-5, D: 3-9, E: 8-20, F: 8-20, E≠F
 * Then convert: out of 30 = Total/2, out of 10 = Total/6
 */
const distributeSubjectMarks = (targetMark, isOutOf30) => {
  const targetOutOf60 = isOutOf30
    ? Math.round(targetMark * 2)
    : Math.round(targetMark * 6);

  const clampedTarget = Math.max(20, Math.min(60, targetOutOf60));

  let b, c, d, e, f;
  let attempts = 0;

  while (attempts < 500) {
    b = randInt(2, 5);
    c = randInt(2, 5);
    d = randInt(3, 9);
    const remaining = clampedTarget - b - c - d;

    if (remaining < 16 || remaining > 40) {
      attempts++;
      continue;
    }

    const eMin = Math.max(8, remaining - 20);
    const eMax = Math.min(20, remaining - 8);
    if (eMin > eMax) { attempts++; continue; }

    e = randInt(eMin, eMax);
    f = remaining - e;

    if (f < 8 || f > 20 || e === f) { attempts++; continue; }

    break;
  }

  if (attempts >= 500) {
    b = 3; c = 3; d = 6;
    const rem = clampedTarget - b - c - d;
    e = Math.min(20, Math.max(8, Math.floor(rem / 2)));
    f = rem - e;
    if (f < 8) { e = rem - 8; f = 8; }
    if (f > 20) { e = rem - 20; f = 20; }
  }

  const totalOutOf60 = b + c + d + e + f;
  const converted = isOutOf30
    ? totalOutOf60 / 2
    : parseFloat((totalOutOf60 / 6).toFixed(4));

  return { b, c, d, e, f, totalOutOf60, converted };
};

/**
 * Generate ES/WCS/ED Excel report
 * Exact format matching actual report files
 */
export const generateSubjectReportExcel = (reportData, subjectType) => {
  const {
    trainees,
    subjectMarks,
    instructorData,
    batchData,
    half,
    assessmentDate,
    tradeData,
    has5Subjects,
  } = reportData;

  const isOutOf30 = !has5Subjects && subjectType === 'ES';

  const reportTitles = {
    ES: 'ANNEXURE-III (FAR-2 )',
    WCS: '(FAR-2 )',
    ED: '(FAR-2 )',
  };

  const subjectTitles = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };

  const conversionLabel = isOutOf30
    ? 'Convert Total Marks in  to 30 Markes =  {(Col.G)/2}'
    : 'Convert Total Marks in  to 10 Markes =  {(Col.G)/6}';

  const wb = XLSX.utils.book_new();

  // Build worksheet as array of arrays
  // Each inner array = one row
  // Columns: A(0) B(1) C(2) D(3) E(4) F(5) G(6) H(7) I(8) J(9) K(10)

  const rows = [];

  // Row 1: Report type
  rows.push([reportTitles[subjectType], '', '', '', '', '', '', '', '', '', '']);

  // Row 2: Internal Assessment
  rows.push(['Internal Assessment', '', '', '', '', '', '', '', '', '', '']);

  // Row 3: Subject title
  rows.push([subjectTitles[subjectType], '', '', '', '', '', '', '', '', '', '']);

  // Row 4: Assessor name + Year of Enrolment
  rows.push([
    'Name & Adddress of the Assessor', '', '',
    instructorData.displayName || '',
    '', '',
    'Year of Enrolment', '', '', '',
    batchData.yearOfAssessment || '',
  ]);

  // Row 5: ITI name + Date of Assessment
  rows.push([
    'Name & Address of ITI (Govt/Pvt)', '', '',
    instructorData.itiName || '',
    '', '',
    'Date of Assessment', '', '', '',
    assessmentDate || '',
  ]);

  // Row 6: Industry address + Assessment Location
  rows.push([
    'Name & Address of the Industry', '', '',
    instructorData.address || '',
    '', '',
    'Assessment Location', '', '', '',
    instructorData.itiName || '',
  ]);

  // Row 7: Trade name + Duration + SEM
  rows.push([
    'Trade Name', '',
    tradeData?.name || '',
    '', '', '',
    'Duration Of  Trade', '', '',
    tradeData ? `${tradeData.duration} Year` : '',
    'SEM', half,
  ]);

  // Row 8: Learning Outcome + Batch No
  rows.push([
    'Learning Outcome :', '', '', '', '', '',
    'Batch No.:', '', '', '',
    batchData.batchNumber || '',
    '',
  ]);

  // Row 9: Column headers
  rows.push([
    'Roll No',
    'Name',
    '',
    'Attendance',
    'Speed for WC & Sc / Accuracy of ED / Comminacation skill fro ES',
    'Creative Work (Chart , Model  ,Poster , Project work etc..)',
    '',
    'Quarterly -1',
    'Quarterly -2',
    'Total',
    conversionLabel,
    'Sign of Trainee',
  ]);

  // Row 10: Maximum marks
  rows.push([
    'Maximum Marks =>', '', '',
    5,    // B - Attendance max
    5,    // C - Speed max
    10,   // D - Creative max
    '',   // F - blank
    20,   // G - Q1 max
    20,   // H - Q2 max
    60,   // I - Total max
    '',   // J - converted
    '',   // K - sign
  ]);

  // Row 11: Column letters
  rows.push([
    'A', '', '',
    'B', 'C', 'D',
    '', 'E', 'F', 'G', 'H', 'I',
  ]);

  // Data rows — one per trainee
  const traineeDistributions = [];

  for (const trainee of trainees) {
    const markEntry = subjectMarks.find(m => m.traineeId === trainee.id);

    let targetMark;
    if (markEntry) {
      if (subjectType === 'ES') targetMark = markEntry.totalESMarks || 0;
      else if (subjectType === 'WCS') targetMark = markEntry.totalWCSMarks || 0;
      else if (subjectType === 'ED') targetMark = markEntry.totalEDMarks || 0;
    } else {
      targetMark = isOutOf30 ? 15 : 5;
    }

    const dist = distributeSubjectMarks(targetMark, isOutOf30);
    traineeDistributions.push({ trainee, dist, targetMark });

    rows.push([
      trainee.enrollmentNumber || '',
      trainee.name || '',
      '',           // C - blank (name spans B-C)
      dist.b,       // D - Attendance
      dist.c,       // E - Speed/Accuracy
      dist.d,       // F - Creative
      '',           // G - blank
      dist.e,       // H - Q1
      dist.f,       // I - Q2
      dist.totalOutOf60,  // J - Total
      dist.converted,     // K - Converted
      '',           // L - Sign
    ]);
  }

  // Blank row
  rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);

  // Sign rows
  rows.push([
    '',
    'Sign of SI :                                                                                                                            Sign of FI :',
    '', '', '', '', '', '', '', '', '', '',
  ]);
  rows.push(['', instructorData.displayName || '', '', '', '', '', '', '', '', '', '', '']);
  rows.push([
    '', instructorData.itiName || '',
    '', '', '', '', '',
    instructorData.itiName || '',
    '', '', '', '',
  ]);

  // Create worksheet from array of arrays
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths to match actual report
  ws['!cols'] = [
    { wch: 14 },  // A - Roll No
    { wch: 32 },  // B - Name
    { wch: 4 },   // C - blank
    { wch: 13 },  // D - Attendance
    { wch: 28 },  // E - Speed/Accuracy
    { wch: 28 },  // F - Creative Work
    { wch: 4 },   // G - blank
    { wch: 14 },  // H - Quarterly 1
    { wch: 14 },  // I - Quarterly 2
    { wch: 10 },  // J - Total
    { wch: 36 },  // K - Converted
    { wch: 14 },  // L - Sign
  ];

  // Set row heights
  ws['!rows'] = rows.map(() => ({ hpt: 20 }));

  const sheetName = `${subjectType}_Report`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return { wb, traineeDistributions };
};

/**
 * Generate ES/WCS/ED PDF report
 */
export const generateSubjectReportPDF = (reportData, subjectType) => {
  const {
    trainees,
    subjectMarks,
    instructorData,
    batchData,
    half,
    assessmentDate,
    tradeData,
    has5Subjects,
  } = reportData;

  const isOutOf30 = !has5Subjects && subjectType === 'ES';

  const subjectTitles = {
    ES: 'INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };

  const conversionLabel = isOutOf30
    ? 'Converted (/30)'
    : 'Converted (/10)';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(subjectType === 'ES' ? 'ANNEXURE-III (FAR-2)' : '(FAR-2)', 14, 12);
  doc.text('Internal Assessment', 14, 18);
  doc.setFontSize(9);
  doc.text(subjectTitles[subjectType], 14, 24);

  // Header info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const headerY = 30;
  doc.text(`Assessor: ${instructorData.displayName || ''}`, 14, headerY);
  doc.text(`Year of Enrolment: ${batchData.yearOfAssessment || ''}`, 120, headerY);
  doc.text(`ITI: ${instructorData.itiName || ''}`, 14, headerY + 5);
  doc.text(`Date of Assessment: ${assessmentDate || ''}`, 120, headerY + 5);
  doc.text(`Address: ${instructorData.address || ''}`, 14, headerY + 10);
  doc.text(`Assessment Location: ${instructorData.itiName || ''}`, 120, headerY + 10);
  doc.text(`Trade: ${tradeData?.name || ''}`, 14, headerY + 15);
  doc.text(`Duration: ${tradeData?.duration || ''} Year`, 120, headerY + 15);
  doc.text(`SEM: ${half}`, 160, headerY + 15);
  doc.text(`Batch No: ${batchData.batchNumber || ''}`, 14, headerY + 20);

  // Table
  const tableHead = [
    ['Roll No', 'Name', 'Attend\n(0-5)', 'Speed\n(0-5)', 'Creative\n(0-10)', 'Q1\n(0-20)', 'Q2\n(0-20)', 'Total\n(0-60)', conversionLabel],
  ];

  const tableBody = trainees.map(trainee => {
    const markEntry = subjectMarks.find(m => m.traineeId === trainee.id);
    let targetMark;
    if (markEntry) {
      if (subjectType === 'ES') targetMark = markEntry.totalESMarks || 0;
      else if (subjectType === 'WCS') targetMark = markEntry.totalWCSMarks || 0;
      else if (subjectType === 'ED') targetMark = markEntry.totalEDMarks || 0;
    } else {
      targetMark = isOutOf30 ? 15 : 5;
    }

    const dist = distributeSubjectMarks(targetMark, isOutOf30);

    return [
      trainee.enrollmentNumber || '',
      trainee.name || '',
      dist.b,
      dist.c,
      dist.d,
      dist.e,
      dist.f,
      dist.totalOutOf60,
      isOutOf30 ? dist.converted : parseFloat(dist.converted.toFixed(2)),
    ];
  });

  doc.autoTable({
    head: tableHead,
    body: tableBody,
    startY: headerY + 25,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 16 },
      8: { cellWidth: 22 },
    },
  });

  // Sign line
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.text('Sign of SI :', 14, finalY);
  doc.text('Sign of FI :', 100, finalY);
  doc.text(instructorData.displayName || '', 14, finalY + 6);
  doc.text(instructorData.itiName || '', 14, finalY + 12);

  return doc;
};
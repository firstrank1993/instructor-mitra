import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Random int between min and max inclusive
 */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Distribute subject marks into sub-components
 * B(Attendance 0-5) + C(Speed 0-5) + D(Creative 0-10) + E(Q1 0-20) + F(Q2 0-20) = Total(0-60)
 * Then convert: out of 30 = Total/2, out of 10 = Total/6
 */
const distributeSubjectMarks = (targetMark, isOutOf30) => {
  const targetOutOf60 = isOutOf30
    ? Math.round(targetMark * 2)
    : Math.round(targetMark * 6);

  const clamped = Math.max(20, Math.min(60, targetOutOf60));

  let b, c, d, e, f;
  let attempts = 0;

  while (attempts < 500) {
    b = randInt(2, 5);
    c = randInt(2, 5);
    d = randInt(3, 9);
    const remaining = clamped - b - c - d;

    if (remaining < 16 || remaining > 40) { attempts++; continue; }

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
    const rem = clamped - b - c - d;
    e = Math.min(20, Math.max(8, Math.floor(rem / 2)));
    f = rem - e;
    if (f < 8) { e = rem - 8; f = 8; }
    if (f > 20) { e = rem - 20; f = 20; }
  }

  const totalOutOf60 = b + c + d + e + f;
  const converted = isOutOf30
    ? totalOutOf60 / 2
    : totalOutOf60 / 6;

  return { b, c, d, e, f, totalOutOf60, converted };
};

/**
 * Generate ES/WCS/ED Excel report
 * Exact format matching actual reports
 * Columns: A=Roll No, B=Name, C=blank, D=Attendance, E=Speed, F=Creative,
 *          G=blank, H=Q1, I=Q2, J=Total, K=Converted, L=Sign
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

  const reportTitle = subjectType === 'ES'
    ? 'ANNEXURE-III (FAR-2 )'
    : '(FAR-2 )';

  const subjectTitle = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  }[subjectType];

  const conversionLabel = isOutOf30
    ? 'Convert Total Marks in  to 30 Markes =\n{(Col.G)/2}'
    : 'Convert Total Marks in  to 10 Markes =\n{(Col.G)/6}';

  // Build marks lookup
  const marksLookup = {};
  for (const m of subjectMarks) {
    marksLookup[m.traineeId] = m;
  }

  const wb = XLSX.utils.book_new();
  const wsData = [];

  // ROW 1: Report type
  wsData.push([reportTitle, '', '', '', '', '', '', '', '', '', '', '']);

  // ROW 2: Internal Assessment
  wsData.push(['Internal Assessment', '', '', '', '', '', '', '', '', '', '', '']);

  // ROW 3: Subject title
  wsData.push([subjectTitle, '', '', '', '', '', '', '', '', '', '', '']);

  // ROW 4: Assessor + Year
  wsData.push([
    'Name & Adddress of the Assessor', '', '',
    instructorData.displayName || '',
    '', '',
    'Year of Enrolment', '', '', '',
    batchData.yearOfAssessment || '',
    '',
  ]);

  // ROW 5: ITI + Date
  wsData.push([
    'Name & Address of ITI (Govt/Pvt)', '', '',
    instructorData.itiName || '',
    '', '',
    'Date of Assessment', '', '', '',
    assessmentDate || '',
    '',
  ]);

  // ROW 6: Industry + Location
  wsData.push([
    'Name & Address of the Industry', '', '',
    instructorData.address || '',
    '', '',
    'Assessment Location', '', '', '',
    instructorData.itiName || '',
    '',
  ]);

  // ROW 7: Trade + Duration + SEM
  wsData.push([
    'Trade Name', '',
    tradeData?.name || '',
    '', '', '',
    'Duration Of  Trade', '', '',
    tradeData ? `${tradeData.duration} Year` : '',
    'SEM',
    half,
  ]);

  // ROW 8: LO + Batch
  wsData.push([
    'Learning Outcome :', '', '', '', '', '',
    'Batch NO', '', '', '',
    batchData.batchNumber || '',
    '',
  ]);

  // ROW 9: Column headers
  wsData.push([
    'Roll No',
    'Name',
    '',
    'Attendance',
    'Speed for WC & Sc / Accuracy of ED / Comminacation skill fro ES',
    'Creative Work (Chart , Model\n,Poster , Project work etc..)',
    '',
    'Quarterly -1',
    'Quarterly -2',
    'Total',
    conversionLabel,
    'Sign of Trainee',
  ]);

  // ROW 10: Maximum marks
  wsData.push([
    'Maximum Marks =>', '', '',
    5, 5, 10, '',
    20, 20, 60,
    '', '',
  ]);

  // ROW 11: Column letters
  wsData.push([
    'A', '', '',
    'B', 'C', 'D',
    '',
    'E', 'F', 'G', 'H', 'I',
  ]);

  // DATA ROWS
  for (const trainee of trainees) {
    const markEntry = marksLookup[trainee.id];

    let targetMark = 0;
    if (markEntry) {
      if (subjectType === 'ES') targetMark = markEntry.totalESMarks || 0;
      else if (subjectType === 'WCS') targetMark = markEntry.totalWCSMarks || 0;
      else if (subjectType === 'ED') targetMark = markEntry.totalEDMarks || 0;
    } else {
      targetMark = isOutOf30 ? 15 : 5;
    }

    const dist = distributeSubjectMarks(targetMark, isOutOf30);

    // Converted display — show exact decimal
    const convertedDisplay = isOutOf30
      ? dist.totalOutOf60 / 2
      : parseFloat((dist.totalOutOf60 / 6).toFixed(10));

    wsData.push([
      trainee.enrollmentNumber || '',  // A - Roll No
      trainee.name || '',              // B - Name
      '',                              // C - blank
      dist.b,                          // D - Attendance
      dist.c,                          // E - Speed
      dist.d,                          // F - Creative
      '',                              // G - blank
      dist.e,                          // H - Q1
      dist.f,                          // I - Q2
      dist.totalOutOf60,               // J - Total
      convertedDisplay,                // K - Converted
      '',                              // L - Sign
    ]);
  }

  // Blank row
  wsData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

  // Sign rows
  wsData.push(['', 'Sign of SI :                                                            Sign of FI :', '', '', '', '', '', '', '', '', '', '']);
  wsData.push(['', instructorData.displayName || '', '', '', '', '', '', '', '', '', '', '']);
  wsData.push(['', instructorData.itiName || '', '', '', '', '', '', '', '', '', '', '']);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths matching actual report
  ws['!cols'] = [
    { wch: 14 },  // A - Roll No
    { wch: 35 },  // B - Name
    { wch: 3 },   // C - blank
    { wch: 12 },  // D - Attendance
    { wch: 28 },  // E - Speed
    { wch: 28 },  // F - Creative
    { wch: 3 },   // G - blank
    { wch: 14 },  // H - Q1
    { wch: 14 },  // I - Q2
    { wch: 10 },  // J - Total
    { wch: 36 },  // K - Converted
    { wch: 14 },  // L - Sign
  ];

  const sheetName = `${subjectType}_Report`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return { wb };
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

  const subjectTitle = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  }[subjectType];

  const conversionLabel = isOutOf30
    ? 'Converted (/30)'
    : 'Converted (/10)';

  const marksLookup = {};
  for (const m of subjectMarks) {
    marksLookup[m.traineeId] = m;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    subjectType === 'ES' ? 'ANNEXURE-III (FAR-2)' : '(FAR-2)',
    14, 10
  );
  doc.setFontSize(8);
  doc.text('Internal Assessment', 14, 15);
  doc.text(subjectTitle, 14, 20);

  // Header info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Assessor: ${instructorData.displayName || ''}`, 14, 26);
  doc.text(`Year of Enrolment: ${batchData.yearOfAssessment || ''}`, 120, 26);
  doc.text(`ITI: ${instructorData.itiName || ''}`, 14, 31);
  doc.text(`Date of Assessment: ${assessmentDate || ''}`, 120, 31);
  doc.text(`Address: ${instructorData.address || ''}`, 14, 36);
  doc.text(`Assessment Location: ${instructorData.itiName || ''}`, 120, 36);
  doc.text(`Trade: ${tradeData?.name || ''}`, 14, 41);
  doc.text(`Duration: ${tradeData?.duration || ''} Year`, 120, 41);
  doc.text(`SEM: ${half}`, 170, 41);
  doc.text(`Batch No: ${batchData.batchNumber || ''}`, 14, 46);

  // Table
  const head = [[
    'Roll No', 'Name',
    'Attend\n(B/5)', 'Speed\n(C/5)', 'Creative\n(D/10)',
    'Q1\n(E/20)', 'Q2\n(F/20)', 'Total\n(G/60)',
    conversionLabel,
  ]];

  const body = trainees.map(trainee => {
    const markEntry = marksLookup[trainee.id];
    let targetMark = isOutOf30 ? 15 : 5;
    if (markEntry) {
      if (subjectType === 'ES') targetMark = markEntry.totalESMarks || targetMark;
      else if (subjectType === 'WCS') targetMark = markEntry.totalWCSMarks || targetMark;
      else if (subjectType === 'ED') targetMark = markEntry.totalEDMarks || targetMark;
    }

    const dist = distributeSubjectMarks(targetMark, isOutOf30);
    const convertedDisplay = isOutOf30
      ? dist.totalOutOf60 / 2
      : parseFloat((dist.totalOutOf60 / 6).toFixed(4));

    return [
      trainee.enrollmentNumber || '',
      trainee.name || '',
      dist.b, dist.c, dist.d,
      dist.e, dist.f,
      dist.totalOutOf60,
      convertedDisplay,
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 50,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [210, 225, 242],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'left' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 14 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14 },
      7: { cellWidth: 14 },
      8: { cellWidth: 22 },
    },
  });

  const finalY = (doc.lastAutoTable?.finalY || 200) + 10;
  doc.setFontSize(8);
  doc.text('Sign of SI:', 14, finalY);
  doc.text('Sign of FI:', 100, finalY);
  doc.text(instructorData.displayName || '', 14, finalY + 6);
  doc.text(instructorData.itiName || '', 14, finalY + 12);

  return doc;
};
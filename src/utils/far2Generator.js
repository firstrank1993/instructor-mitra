import ExcelJS from 'exceljs';

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function toDisplayDate(value) {
  if (!value) return '';
  let d;
  if (value instanceof Date) d = value;
  else if (typeof value === 'string') {
    if (value.includes('/')) return value;
    d = new Date(value);
  } else {
    return String(value);
  }
  if (isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const distributeSubjectMarks = (targetMark, isOutOf30) => {
  const target60 = isOutOf30 ? Math.round(targetMark * 2) : Math.round(targetMark * 6);
  const clamped = Math.max(20, Math.min(60, target60));
  let b, c, d, e, f;
  let attempts = 0;
  while (attempts < 500) {
    b = randInt(2, 5); c = randInt(2, 5); d = randInt(3, 9);
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
  return { b, c, d, e, f, total60: b + c + d + e + f };
};

function setCell(ws, address, value, opts = {}) {
  const cell = ws.getCell(address);
  cell.value = value;
  cell.font = { name: 'Arial MT', size: opts.size || 10, bold: !!opts.bold };
  cell.alignment = { horizontal: opts.h || 'left', vertical: 'middle', wrapText: opts.wrap !== false };
  if (opts.border) cell.border = BORDER_ALL;
}

/** Build a safe, unique Excel sheet name. ES/WCS/ED are single-sheet reports
 *  (all trainees on one sheet), so this is only used for the sheet's own title,
 *  not per-trainee — kept here for consistency with far1Generator. */
function safeSheetName(base) {
  return String(base || 'Report').replace(/[/\\*?[\]:]/g, '_').substring(0, 31) || 'Report';
}

export const generateSubjectReportExcel = async (reportData, subjectType) => {
  const {
    trainees, subjectMarks, instructorData, batchData,
    half, assessmentDate, tradeData, has5Subjects,
  } = reportData;

  const isOutOf30 = !has5Subjects && subjectType === 'ES';
  const titleMap = { ES: 'ANNEXURE-III (FAR-2 )', WCS: '(FAR-2 )', ED: '(FAR-2 )' };
  const subjectTitleMap = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };
  const convertLabel = isOutOf30
    ? 'Convert Total Marks in  to 30 Markes =\n{(Col.G)/2}'
    : 'Convert Total Marks in  to 10 Markes =\n{(Col.G)/6}';
  const formulaSuffix = isOutOf30 ? '/2' : '/6';
  const displayDate = toDisplayDate(assessmentDate);

  const marksLookup = {};
  for (const m of subjectMarks) marksLookup[m.traineeId] = m;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(safeSheetName(`${subjectType}_Report`), {
    pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const widths = [4.83, 20.0, 23.66, 7.83, 15.16, 7.5, 8.0, 7.33, 8.0, 8.43, 15.16, 8.16];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  ws.getRow(1).height = 18;
  ws.mergeCells('A1:L1');
  setCell(ws, 'A1', titleMap[subjectType], { bold: true, size: 14, h: 'center' });

  ws.getRow(2).height = 18;
  ws.mergeCells('A2:L2');
  setCell(ws, 'A2', 'Internal Assessment', { bold: true, size: 12, h: 'center' });

  ws.getRow(3).height = 18;
  ws.mergeCells('A3:L3');
  setCell(ws, 'A3', subjectTitleMap[subjectType], { bold: true, size: 10, h: 'center' });

  ws.getRow(4).height = 18;
  ws.mergeCells('A4:C4'); setCell(ws, 'A4', 'Name & Adddress of the Assessor');
  ws.mergeCells('D4:F4'); setCell(ws, 'D4', instructorData.displayName || '', { bold: true });
  ws.mergeCells('G4:J4'); setCell(ws, 'G4', 'Year of Enrolment');
  ws.mergeCells('K4:L4'); setCell(ws, 'K4', batchData.yearOfAssessment || '', { bold: true });

  ws.getRow(5).height = 18;
  ws.mergeCells('A5:C5'); setCell(ws, 'A5', 'Name & Address of ITI (Govt/Pvt)');
  ws.mergeCells('D5:F5'); setCell(ws, 'D5', instructorData.itiName || '', { bold: true });
  ws.mergeCells('G5:J5'); setCell(ws, 'G5', 'Date of Assessment');
  ws.mergeCells('K5:L5'); setCell(ws, 'K5', displayDate, { bold: true });

  ws.getRow(6).height = 18;
  ws.mergeCells('A6:C6'); setCell(ws, 'A6', 'Name & Address of the Industry');
  ws.mergeCells('D6:F6'); setCell(ws, 'D6', instructorData.address || '', { bold: true });
  ws.mergeCells('G6:J6'); setCell(ws, 'G6', 'Assessment Location');
  ws.mergeCells('K6:L6'); setCell(ws, 'K6', instructorData.itiName || '', { bold: true });

  ws.getRow(7).height = 24;
  ws.mergeCells('A7:B7'); setCell(ws, 'A7', 'Trade Name');
  ws.mergeCells('C7:F7'); setCell(ws, 'C7', tradeData?.name || '', { bold: true, h: 'center' });
  ws.mergeCells('G7:I7'); setCell(ws, 'G7', 'Duration Of  Trade');
  setCell(ws, 'J7', tradeData ? `${tradeData.duration} Year` : '', { bold: true });
  setCell(ws, 'K7', 'SEM');
  setCell(ws, 'L7', half, { bold: true });

  ws.getRow(8).height = 18;
  ws.mergeCells('A8:F8'); setCell(ws, 'A8', 'Learning Outcome :');
  ws.mergeCells('G8:J8'); setCell(ws, 'G8', 'Batch NO');
  ws.mergeCells('K8:L8'); setCell(ws, 'K8', batchData.batchNumber || '', { bold: true });

  // Row 9 — column headers (only B9:C9 and F9:G9 merge per actual report; A9 itself is plain, unmerged)
  ws.getRow(9).height = 64;
  setCell(ws, 'A9', 'Roll\nNo', { bold: true, h: 'left', border: true, size: 10 });
  ws.mergeCells('B9:C9');
  setCell(ws, 'B9', 'Name', { bold: true, h: 'center', border: true, size: 10 });
  setCell(ws, 'D9', 'Attendance', { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'E9', 'Speed for WC & Sc\n/ Accuracy of ED /\nComminacation\nskill fro ES', { bold: true, h: 'center', border: true, size: 8 });
  ws.mergeCells('F9:G9');
  setCell(ws, 'F9', 'Creative Work\n(Chart , Model\n,Poster , Project\nwork etc..)', { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'H9', 'Quarterly -1', { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'I9', 'Quarterly -2', { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'J9', 'Total', { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'K9', convertLabel, { bold: true, h: 'center', border: true, size: 8 });
  setCell(ws, 'L9', 'Sign of\nTrainee', { bold: true, h: 'center', border: true, size: 8 });

  // Row 10 — Maximum Marks (A10:C10 merged per actual report, not just B10:C10)
  ws.getRow(10).height = 18;
  ws.mergeCells('A10:C10');
  setCell(ws, 'A10', 'Maximum Marks =>', { bold: true, h: 'left', border: true, size: 9 });
  setCell(ws, 'D10', 5, { bold: true, h: 'center', border: true });
  setCell(ws, 'E10', 5, { bold: true, h: 'center', border: true });
  ws.mergeCells('F10:G10');
  setCell(ws, 'F10', 10, { bold: true, h: 'center', border: true });
  setCell(ws, 'H10', 20, { bold: true, h: 'center', border: true });
  setCell(ws, 'I10', 20, { bold: true, h: 'center', border: true });
  setCell(ws, 'J10', 60, { bold: true, h: 'center', border: true });
  setCell(ws, 'K10', '', { border: true });
  setCell(ws, 'L10', '', { border: true });

  // Row 11 — Column letters (A11:C11 merged per actual report)
  ws.getRow(11).height = 18;
  ws.mergeCells('A11:C11');
  setCell(ws, 'A11', 'A', { bold: true, h: 'center', border: true });
  setCell(ws, 'D11', 'B', { bold: true, h: 'center', border: true });
  setCell(ws, 'E11', 'C', { bold: true, h: 'center', border: true });
  ws.mergeCells('F11:G11');
  setCell(ws, 'F11', 'D', { bold: true, h: 'center', border: true });
  setCell(ws, 'H11', 'E', { bold: true, h: 'center', border: true });
  setCell(ws, 'I11', 'F', { bold: true, h: 'center', border: true });
  setCell(ws, 'J11', 'G', { bold: true, h: 'center', border: true });
  setCell(ws, 'K11', 'H', { bold: true, h: 'center', border: true });
  setCell(ws, 'L11', 'I', { bold: true, h: 'center', border: true });

  let rowIdx = 12;
  for (const trainee of trainees) {
    ws.getRow(rowIdx).height = 18;
    const markEntry = marksLookup[trainee.id] || {};
    let target;
    if (subjectType === 'ES') target = markEntry.totalESMarks ?? (isOutOf30 ? 15 : 5);
    else if (subjectType === 'WCS') target = markEntry.totalWCSMarks ?? 5;
    else target = markEntry.totalEDMarks ?? 5;

    const { b, c, d, e, f } = distributeSubjectMarks(target, isOutOf30);

    // Roll number: plain cell, NOT merged, matching actual report exactly
    setCell(ws, `A${rowIdx}`, trainee.rollNumber || trainee.enrollmentNumber || '', { h: 'left', border: true, size: 10 });
    ws.mergeCells(`B${rowIdx}:C${rowIdx}`);
    setCell(ws, `B${rowIdx}`, trainee.name || '', { h: 'left', border: true });
    setCell(ws, `D${rowIdx}`, b, { h: 'center', border: true });
    setCell(ws, `E${rowIdx}`, c, { h: 'center', border: true });
    ws.mergeCells(`F${rowIdx}:G${rowIdx}`);
    setCell(ws, `F${rowIdx}`, d, { h: 'center', border: true });
    setCell(ws, `H${rowIdx}`, e, { h: 'center', border: true });
    setCell(ws, `I${rowIdx}`, f, { h: 'center', border: true });
    setCell(ws, `J${rowIdx}`, { formula: `SUM(D${rowIdx}:I${rowIdx})` }, { h: 'center', border: true });
    setCell(ws, `K${rowIdx}`, { formula: `J${rowIdx}${formulaSuffix}` }, { h: 'center', border: true });
    setCell(ws, `L${rowIdx}`, '', { border: true });
    rowIdx++;
  }

  // Sign block — matches actual report's exact merges:
  // B(blank row), then "Sign of SI / Sign of FI" merged B:K, then SI name (B:C merged),
  // then ITI name appearing TWICE: once at B:C merged, once at H:K merged.
  rowIdx++;
  ws.mergeCells(`B${rowIdx}:K${rowIdx}`);
  setCell(ws, `B${rowIdx}`, 'Sign of SI :                                                                                                                            Sign of FI :');
  rowIdx++;
  ws.mergeCells(`B${rowIdx}:C${rowIdx}`);
  setCell(ws, `B${rowIdx}`, instructorData.displayName || '', { bold: true });
  rowIdx++;
  ws.mergeCells(`B${rowIdx}:C${rowIdx}`);
  setCell(ws, `B${rowIdx}`, instructorData.itiName || '');
  ws.mergeCells(`H${rowIdx}:K${rowIdx}`);
  setCell(ws, `H${rowIdx}`, instructorData.itiName || '');

  return wb;
};

export const downloadWorkbook = async (wb, filename) => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================
// PDF GENERATION — mirrors the Excel layout exactly
// Single page, A4 portrait, same header rows 1-8 and same 12-column table.
// ============================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSubjectReportPDF = (reportData, subjectType) => {
  const {
    trainees, subjectMarks, instructorData, batchData,
    half, assessmentDate, tradeData, has5Subjects,
  } = reportData;

  const isOutOf30 = !has5Subjects && subjectType === 'ES';
  const titleMap = { ES: 'ANNEXURE-III (FAR-2 )', WCS: '(FAR-2 )', ED: '(FAR-2 )' };
  const subjectTitleMap = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };
  const convertLabel = isOutOf30 ? 'Converted\n(/30)' : 'Converted\n(/10)';
  const displayDate = toDisplayDate(assessmentDate);
  const marksLookup = {};
  for (const m of subjectMarks) marksLookup[m.traineeId] = m;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(titleMap[subjectType], 105, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Internal Assessment', 105, 16, { align: 'center' });
  doc.setFontSize(8);
  doc.text(subjectTitleMap[subjectType], 105, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const y0 = 27;
  doc.text(`Name & Address of the Assessor: ${instructorData.displayName || ''}`, 6, y0);
  doc.text(`Year of Enrolment: ${batchData.yearOfAssessment || ''}`, 130, y0);
  doc.text(`Name & Address of ITI: ${instructorData.itiName || ''}`, 6, y0 + 5);
  doc.text(`Date of Assessment: ${displayDate}`, 130, y0 + 5);
  doc.text(`Name & Address of Industry: ${instructorData.address || ''}`, 6, y0 + 10);
  doc.text(`Assessment Location: ${instructorData.itiName || ''}`, 130, y0 + 10);
  doc.text(`Trade Name: ${tradeData?.name || ''}`, 6, y0 + 15);
  doc.text(`Duration: ${tradeData?.duration || ''} Year`, 100, y0 + 15);
  doc.text(`SEM: ${half}`, 150, y0 + 15);
  doc.text(`Batch No: ${batchData.batchNumber || ''}`, 6, y0 + 20);

  // Verified, page-fitted column widths for A4 portrait (sum = 194mm usable width)
  const colWidths = [16.02, 44.5, 14.24, 24.92, 24.92, 12.46, 12.46, 12.46, 19.58, 12.46];

  const head = [[
    'Roll\nNo', 'Name', 'Attend\n(B/5)', 'Speed\n(C/5)', 'Creative\n(D/10)',
    'Q1\n(E/20)', 'Q2\n(F/20)', 'Total\n(G/60)', convertLabel, 'Sign of\nTrainee',
  ]];

  const body = trainees.map(trainee => {
    const markEntry = marksLookup[trainee.id] || {};
    let target = isOutOf30 ? 15 : 5;
    if (subjectType === 'ES') target = markEntry.totalESMarks ?? target;
    else if (subjectType === 'WCS') target = markEntry.totalWCSMarks ?? target;
    else target = markEntry.totalEDMarks ?? target;

    const { b, c, d, e, f, total60 } = distributeSubjectMarks(target, isOutOf30);
    const converted = isOutOf30 ? total60 / 2 : parseFloat((total60 / 6).toFixed(4));

    return [
      trainee.rollNumber || trainee.enrollmentNumber || '',
      trainee.name || '',
      b, c, d, e, f, total60, converted, '',
    ];
  });

  autoTable(doc, {
    head, body, startY: y0 + 25,
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.15 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'left' },
      1: { cellWidth: colWidths[1], halign: 'left' },
      2: { cellWidth: colWidths[2] }, 3: { cellWidth: colWidths[3] }, 4: { cellWidth: colWidths[4] },
      5: { cellWidth: colWidths[5] }, 6: { cellWidth: colWidths[6] }, 7: { cellWidth: colWidths[7] },
      8: { cellWidth: colWidths[8] }, 9: { cellWidth: colWidths[9] },
    },
    margin: { left: 8, right: 8 },
  });

  const finalY = (doc.lastAutoTable?.finalY || 200) + 10;
  doc.setFontSize(8);
  doc.text('Sign of SI :', 8, finalY);
  doc.text('Sign of FI :', 110, finalY);
  doc.text(instructorData.displayName || '', 8, finalY + 6);
  doc.text(instructorData.itiName || '', 8, finalY + 12);
  doc.text(instructorData.itiName || '', 110, finalY + 12);

  return doc;
};
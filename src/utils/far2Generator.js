import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

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
  cell.font = { name: 'Calibri', size: opts.size || 11, bold: !!opts.bold };
  cell.alignment = { horizontal: opts.h || 'left', vertical: 'middle', wrapText: opts.wrap !== false };
  if (opts.border) cell.border = BORDER_ALL;
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

  const marksLookup = {};
  for (const m of subjectMarks) marksLookup[m.traineeId] = m;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${subjectType}_Report`, {
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
  ws.mergeCells('K5:L5'); setCell(ws, 'K5', assessmentDate || '', { bold: true });

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

  ws.getRow(9).height = 64;
  setCell(ws, 'A9', 'Roll\nNo', { bold: true, h: 'center', border: true });
  ws.mergeCells('B9:C9');
  setCell(ws, 'B9', 'Name', { bold: true, h: 'center', border: true });
  setCell(ws, 'D9', 'Attendance', { bold: true, h: 'center', border: true });
  setCell(ws, 'E9', 'Speed for WC & Sc\n/ Accuracy of ED /\nComminacation\nskill fro ES', { bold: true, h: 'center', border: true });
  ws.mergeCells('F9:G9');
  setCell(ws, 'F9', 'Creative Work\n(Chart , Model\n,Poster , Project\nwork etc..)', { bold: true, h: 'center', border: true });
  setCell(ws, 'H9', 'Quarterly -1', { bold: true, h: 'center', border: true });
  setCell(ws, 'I9', 'Quarterly -2', { bold: true, h: 'center', border: true });
  setCell(ws, 'J9', 'Total', { bold: true, h: 'center', border: true });
  setCell(ws, 'K9', convertLabel, { bold: true, h: 'center', border: true });
  setCell(ws, 'L9', 'Sign of\nTrainee', { bold: true, h: 'center', border: true });
  ['C9', 'G9'].forEach(a => { ws.getCell(a).border = BORDER_ALL; });

  ws.getRow(10).height = 18;
  setCell(ws, 'A10', 'Maximum Marks =>', { bold: true, border: true });
  ws.mergeCells('B10:C10'); setCell(ws, 'B10', '', { border: true });
  setCell(ws, 'D10', 5, { bold: true, h: 'center', border: true });
  setCell(ws, 'E10', 5, { bold: true, h: 'center', border: true });
  ws.mergeCells('F10:G10'); setCell(ws, 'F10', 10, { bold: true, h: 'center', border: true });
  setCell(ws, 'H10', 20, { bold: true, h: 'center', border: true });
  setCell(ws, 'I10', 20, { bold: true, h: 'center', border: true });
  setCell(ws, 'J10', 60, { bold: true, h: 'center', border: true });
  setCell(ws, 'K10', '', { border: true });
  setCell(ws, 'L10', '', { border: true });

  ws.getRow(11).height = 18;
  setCell(ws, 'A11', 'A', { bold: true, h: 'center', border: true });
  ws.mergeCells('B11:C11'); setCell(ws, 'B11', '', { border: true });
  setCell(ws, 'D11', 'B', { bold: true, h: 'center', border: true });
  setCell(ws, 'E11', 'C', { bold: true, h: 'center', border: true });
  ws.mergeCells('F11:G11'); setCell(ws, 'F11', 'D', { bold: true, h: 'center', border: true });
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

    setCell(ws, `A${rowIdx}`, trainee.rollNumber || trainee.enrollmentNumber || '', { h: 'left', border: true });
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

  rowIdx++;
  ws.mergeCells(`B${rowIdx}:K${rowIdx}`);
  setCell(ws, `B${rowIdx}`, 'Sign of SI :                                                            Sign of FI :');
  rowIdx++;
  setCell(ws, `B${rowIdx}`, instructorData.displayName || '', { bold: true });
  rowIdx++;
  setCell(ws, `B${rowIdx}`, instructorData.itiName || '');
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

export const generateSubjectReportPDF = (reportData, subjectType) => {
  const {
    trainees, subjectMarks, instructorData, batchData,
    half, assessmentDate, tradeData, has5Subjects,
  } = reportData;
  const isOutOf30 = !has5Subjects && subjectType === 'ES';
  const subjectTitleMap = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };
  const convertLabel = isOutOf30 ? 'Converted (/30)' : 'Converted (/10)';
  const marksLookup = {};
  for (const m of subjectMarks) marksLookup[m.traineeId] = m;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(subjectType === 'ES' ? 'ANNEXURE-III (FAR-2)' : '(FAR-2)', 14, 10);
  doc.setFontSize(8);
  doc.text('Internal Assessment', 14, 15);
  doc.text(subjectTitleMap[subjectType], 14, 20);
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

  const head = [['Roll No', 'Name', 'Attend\n(B/5)', 'Speed\n(C/5)', 'Creative\n(D/10)', 'Q1\n(E/20)', 'Q2\n(F/20)', 'Total\n(G/60)', convertLabel]];
  const body = trainees.map(trainee => {
    const markEntry = marksLookup[trainee.id] || {};
    let target = isOutOf30 ? 15 : 5;
    if (subjectType === 'ES') target = markEntry.totalESMarks ?? target;
    else if (subjectType === 'WCS') target = markEntry.totalWCSMarks ?? target;
    else target = markEntry.totalEDMarks ?? target;
    const { b, c, d, e, f, total60 } = distributeSubjectMarks(target, isOutOf30);
    const converted = isOutOf30 ? total60 / 2 : parseFloat((total60 / 6).toFixed(4));
    return [trainee.enrollmentNumber || '', trainee.name || '', b, c, d, e, f, total60, converted];
  });

  autoTable(doc, {
    head, body, startY: 50,
    styles: { fontSize: 7, cellPadding: 2, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [210, 225, 242], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25, halign: 'left' }, 1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 14 }, 3: { cellWidth: 14 }, 4: { cellWidth: 14 },
      5: { cellWidth: 14 }, 6: { cellWidth: 14 }, 7: { cellWidth: 14 }, 8: { cellWidth: 22 },
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
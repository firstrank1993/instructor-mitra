import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const CRITERIA = [
  { name: 'Safety consciousness', subs: [
    { name: 'Dress code', max: 2 },
    { name: 'Use PPE', max: 5 },
    { name: 'Apply/practice safety', max: 8 },
  ], total: 15 },
  { name: 'Workplace hygiene  & Economical use of materials', subs: [
    { name: 'Maintain personal & \nworkplace cleanliness', max: 3 },
    { name: 'Dispose scrap as per \nstandard practice', max: 2 },
    { name: 'Select appropriate material \n&  minimize wastage', max: 5 },
  ], total: 10 },
  { name: 'Attendance/ Punctuality', subs: [
    { name: 'Initiative', max: 3 },
    { name: 'Accountability', max: 3 },
    { name: 'Participative in work', max: 4 },
  ], total: 10 },
  { name: 'Ability to follow Manuals/ Written instructions', subs: [
    { name: 'Select right manual', max: 1 },
    { name: 'Search for appropriate topic', max: 2 },
    { name: 'Read & interpret the manual', max: 2 },
  ], total: 5 },
  { name: 'Application of Knowledge', subs: [
    { name: 'Plan the work', max: 4 },
    { name: 'Select appropriate tools \n& equipment', max: 3 },
    { name: 'Review the work', max: 3 },
  ], total: 10 },
  { name: 'Skills to handle tools & equipment', subs: [
    { name: 'Handle & use tools & \nequipment', max: 4 },
    { name: 'Maintain safety in handling', max: 3 },
    { name: 'Care & maintain', max: 3 },
  ], total: 10 },
  { name: 'Speed in doing work', subs: [
    { name: 'Properly sequence the work', max: 3 },
    { name: 'Use appropriate technique', max: 5 },
    { name: 'Review the work during execution', max: 2 },
  ], total: 10 },
  { name: 'Quality in workmanship', subs: [
    { name: 'Achieve work with high accuracy', max: 7 },
    { name: 'Conform to requirement', max: 3 },
    { name: 'Satisfy the purpose', max: 5 },
  ], total: 15 },
  { name: 'VIVA', subs: [
    { name: 'Response with clarity', max: 7 },
    { name: 'Technical understanding', max: 5 },
    { name: 'Conscious towards job role', max: 3 },
  ], total: 15 },
];

const COL_WIDTHS = [
  0.43, 8.57, 5.00,
  3.57, 2.86, 3.14, 3.43,
  4.57, 4.71, 4.00, 3.14,
  3.43, 2.86, 3.43, 3.57,
  2.86, 3.29, 3.14, 3.00,
  3.14, 4.29, 3.29, 3.57,
  5.14, 3.00, 2.86, 3.29,
  8.43, 4.86, 4.57, 3.86,
  8.43, 3.14, 3.43, 4.43,
  3.00, 8.43, 3.14, 8.43,
  4.14, 4.43, 5.57, 0.14,
];

function setCell(ws, addr, value, opts = {}) {
  const cell = ws.getCell(addr);
  cell.value = value;
  cell.font = { name: 'Arial', size: opts.size || 10, bold: !!opts.bold, color: { argb: 'FF000000' } };
  cell.alignment = {
    horizontal: opts.h || 'center',
    vertical: 'middle',
    wrapText: opts.wrap !== false,
    textRotation: opts.rotate || 0,
  };
  if (opts.border !== false) cell.border = BORDER_ALL;
  if (opts.fill) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
  }
}

export const generateFAR1Excel = async (reportData) => {
  const {
    trainees, distributedMarks, instructorData, batchData,
    half, assessmentDate, tradeData,
  } = reportData;

  const wb = new ExcelJS.Workbook();

  for (const trainee of trainees) {
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );
    if (traineeMarks.length === 0) continue;

    const loGroups = {};
    for (const mark of traineeMarks) {
      if (!loGroups[mark.loId]) {
        loGroups[mark.loId] = {
          loId: mark.loId, loName: mark.loName, loNumber: mark.loNumber,
          loMark: mark.loMark, practicals: [],
        };
      }
      loGroups[mark.loId].practicals.push(mark);
    }
    const sortedLOs = Object.values(loGroups).sort((a, b) => a.loNumber - b.loNumber);

    let sheetName = (trainee.name || `T${trainee.enrollmentNumber || ''}`).substring(0, 28);
    sheetName = sheetName.replace(/[/\\*?[\]:]/g, '_') || 'Sheet';

    const ws = wb.addWorksheet(sheetName, {
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    // Row 1: Title merged B1:AP1
    ws.mergeCells(1, 2, 1, 42);
    setCell(ws, 'B1', 'Internal Assessment', { bold: true, size: 11 });
    ws.getRow(1).height = 15;

    // Year of enrollment from dateOfAdmission
    const doa = trainee.dateOfAdmission || '';
    let yearOfEnrollment = batchData.yearOfAssessment || '';
    if (doa.includes('/')) {
      const parts = doa.split('/');
      if (parts.length === 3) yearOfEnrollment = parts[2];
    } else if (doa.includes('-')) {
      yearOfEnrollment = doa.split('-')[0];
    }

    // Row 2
    ws.getRow(2).height = 15;
    ws.mergeCells(2, 2, 2, 5);
    setCell(ws, 'B2', 'Name of Trainee:', { h: 'left', border: false });
    ws.mergeCells(2, 6, 2, 18);
    setCell(ws, 'F2', trainee.name || '', { bold: true, h: 'left', border: false });
    setCell(ws, 'S2', 'Roll NO:', { h: 'left', border: false });
    setCell(ws, 'V2', trainee.rollNumber || trainee.enrollmentNumber || '', { bold: true, border: false });
    ws.mergeCells(2, 24, 2, 30);
    setCell(ws, 'X2', 'Year of Enrollment:', { h: 'left', border: false });
    ws.mergeCells(2, 31, 2, 34);
    setCell(ws, 'AE2', yearOfEnrollment, { bold: true, border: false });
    setCell(ws, 'AI2', 'Sem:', { h: 'left', border: false });
    setCell(ws, 'AM2', half, { bold: true, border: false });

    // Row 3
    ws.getRow(3).height = 15;
    ws.mergeCells(3, 2, 3, 5);
    setCell(ws, 'B3', 'Name of ITI:', { h: 'left', border: false });
    ws.mergeCells(3, 6, 3, 18);
    setCell(ws, 'F3', instructorData.itiName || '', { bold: true, h: 'left', border: false });
    ws.mergeCells(3, 24, 3, 30);
    setCell(ws, 'X3', 'Date of Assessment:', { h: 'left', border: false });
    ws.mergeCells(3, 31, 3, 34);
    setCell(ws, 'AE3', assessmentDate || '', { bold: true, border: false });
    setCell(ws, 'AI3', 'Batch:', { h: 'left', border: false });
    setCell(ws, 'AM3', batchData.batchNumber || '', { bold: true, border: false });

    // Row 4
    ws.getRow(4).height = 15;
    ws.mergeCells(4, 2, 4, 5);
    setCell(ws, 'B4', 'Name of the Industry:', { h: 'left', border: false });
    ws.mergeCells(4, 6, 4, 23);
    setCell(ws, 'F4', tradeData?.name || '', { bold: true, h: 'left', border: false });
    ws.mergeCells(4, 24, 4, 30);
    setCell(ws, 'X4', 'Assessment Location:', { h: 'left', border: false });
    ws.mergeCells(4, 31, 4, 42);
    setCell(ws, 'AE4', instructorData.address || '', { bold: true, border: false });

    // Row 5
    ws.getRow(5).height = 15;
    const duration = tradeData?.duration || 1;
    ws.mergeCells(5, 2, 5, 5);
    setCell(ws, 'B5', 'Trade Name:', { h: 'left', border: false });
    ws.mergeCells(5, 6, 5, 23);
    setCell(ws, 'F5', tradeData?.name || '', { bold: true, h: 'left', border: false });
    ws.mergeCells(5, 24, 5, 30);
    setCell(ws, 'X5', 'Duration of the Trade:', { h: 'left', border: false });
    ws.mergeCells(5, 31, 5, 34);
    setCell(ws, 'AE5', `${duration} Year`, { bold: true, border: false });
    setCell(ws, 'AI5', 'S.I.Name:', { h: 'left', border: false });
    ws.mergeCells(5, 38, 5, 42);
    setCell(ws, 'AL5', instructorData.displayName || '', { bold: true, border: false });

    // Row 6: criteria group headers
    ws.getRow(6).height = 43;
    setCell(ws, 'B6', '');
    setCell(ws, 'C6', '');
    let col = 4;
    for (const criteria of CRITERIA) {
      const startCol = col;
      const endCol = col + criteria.subs.length;
      ws.mergeCells(6, startCol, 6, endCol);
      setCell(ws, ws.getCell(6, startCol).address, criteria.name, { bold: true, size: 10 });
      col = endCol + 1;
    }
    setCell(ws, 'AN6', '');
    setCell(ws, 'AO6', '');
    setCell(ws, 'AP6', '');

    // Row 7: sub-criteria headers (rotated)
    ws.getRow(7).height = 126;
    setCell(ws, 'B7', 'Learning Outcome Number', { bold: true, size: 8, rotate: 90 });
    setCell(ws, 'C7', 'Practical / \nProfessional Skill Number', { bold: true, size: 8, rotate: 90 });
    col = 4;
    for (const criteria of CRITERIA) {
      for (const sub of criteria.subs) {
        setCell(ws, ws.getCell(7, col).address, sub.name, { bold: true, size: 8, rotate: 90 });
        col++;
      }
      setCell(ws, ws.getCell(7, col).address, 'Total', { bold: true, size: 8, rotate: 90 });
      col++;
    }
    setCell(ws, 'AN7', 'Grand Total', { bold: true, size: 8, rotate: 90 });
    setCell(ws, 'AO7', 'Signature of Trainee', { bold: true, size: 8, rotate: 90 });
    setCell(ws, 'AP7', 'Signature of SI', { bold: true, size: 8, rotate: 90 });

    // Row 8: max marks
    ws.getRow(8).height = 15;
    setCell(ws, 'B8', '');
    setCell(ws, 'C8', '');
    col = 4;
    for (const criteria of CRITERIA) {
      for (const sub of criteria.subs) {
        setCell(ws, ws.getCell(8, col).address, sub.max, { bold: true });
        col++;
      }
      setCell(ws, ws.getCell(8, col).address, criteria.total, { bold: true });
      col++;
    }
    setCell(ws, 'AN8', 100, { bold: true });
    setCell(ws, 'AO8', '');
    setCell(ws, 'AP8', '');

    // Data rows
    let currentRow = 9;
    for (const lo of sortedLOs) {
      const sortedPracticals = [...lo.practicals].sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );

      for (const practical of sortedPracticals) {
        ws.getRow(currentRow).height = 15;
        setCell(ws, ws.getCell(currentRow, 1).address, '');
        setCell(ws, ws.getCell(currentRow, 2).address, `LO - ${lo.loNumber}`);
        setCell(ws, ws.getCell(currentRow, 3).address, practical.practicalNumber || '');

        let dataCol = 4;
        let grandTotal = 0;
        for (const criteria of practical.criteriaMarks || []) {
          for (const subMark of criteria.subCriteriaMarks || []) {
            setCell(ws, ws.getCell(currentRow, dataCol).address, subMark.allocatedMark || 0);
            dataCol++;
          }
          const cTotal = criteria.allocatedMark || 0;
          setCell(ws, ws.getCell(currentRow, dataCol).address, cTotal);
          grandTotal += cTotal;
          dataCol++;
        }
        setCell(ws, ws.getCell(currentRow, 40).address, grandTotal);
        setCell(ws, ws.getCell(currentRow, 41).address, '');
        setCell(ws, ws.getCell(currentRow, 42).address, '');
        currentRow++;
      }

      // LO average row
      ws.getRow(currentRow).height = 15;
      ws.mergeCells(currentRow, 2, currentRow, 32);
      setCell(ws, ws.getCell(currentRow, 2).address, lo.loName || `LO ${lo.loNumber}`,
        { bold: true, h: 'left', fill: 'FFAFEEEE' });
      ws.mergeCells(currentRow, 33, currentRow, 39);
      setCell(ws, ws.getCell(currentRow, 33).address, `Average of LO${lo.loNumber}`,
        { bold: true, h: 'right', fill: 'FFAFEEEE' });
      setCell(ws, ws.getCell(currentRow, 40).address, lo.loMark || 0, { bold: true, fill: 'FFAFEEEE' });
      setCell(ws, ws.getCell(currentRow, 41).address, '', { fill: 'FFAFEEEE' });
      setCell(ws, ws.getCell(currentRow, 42).address, '', { fill: 'FFAFEEEE' });
      currentRow++;
    }

    // Overall average row
    const overallAvg = sortedLOs.length > 0
      ? Math.round(sortedLOs.reduce((s, lo) => s + (lo.loMark || 0), 0) / sortedLOs.length)
      : 0;
    ws.getRow(currentRow).height = 15;
    ws.mergeCells(currentRow, 2, currentRow, 39);
    setCell(ws, ws.getCell(currentRow, 2).address, 'Average of All LO',
      { bold: true, h: 'left', fill: 'FFD3D3D3' });
    setCell(ws, ws.getCell(currentRow, 40).address, overallAvg, { bold: true, fill: 'FFD3D3D3' });
    setCell(ws, ws.getCell(currentRow, 41).address, '', { fill: 'FFD3D3D3' });
    setCell(ws, ws.getCell(currentRow, 42).address, '', { fill: 'FFD3D3D3' });
  }

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

export const generateFAR1PDF = (reportData) => {
  const {
    trainees, distributedMarks, instructorData, batchData,
    half, assessmentDate, tradeData,
  } = reportData;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let firstPage = true;

  for (const trainee of trainees) {
    const traineeMarks = distributedMarks.filter(
      m => m.traineeId === trainee.id && m.half === half
    );
    if (traineeMarks.length === 0) continue;

    if (!firstPage) doc.addPage();
    firstPage = false;

    const loGroups = {};
    for (const mark of traineeMarks) {
      if (!loGroups[mark.loId]) {
        loGroups[mark.loId] = {
          loId: mark.loId, loName: mark.loName, loNumber: mark.loNumber,
          loMark: mark.loMark, practicals: [],
        };
      }
      loGroups[mark.loId].practicals.push(mark);
    }
    const sortedLOs = Object.values(loGroups).sort((a, b) => a.loNumber - b.loNumber);

    const doa = trainee.dateOfAdmission || '';
    let yearOfEnrollment = batchData.yearOfAssessment || '';
    if (doa.includes('/')) yearOfEnrollment = doa.split('/')[2] || yearOfEnrollment;
    else if (doa.includes('-')) yearOfEnrollment = doa.split('-')[0] || yearOfEnrollment;

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
      'Rsp\n/7', 'Tec\n/5', 'Job\n/3', 'C9\n/15', 'GT\n/100',
    ]];

    const body = [];
    for (const lo of sortedLOs) {
      const sortedPracticals = [...lo.practicals].sort(
        (a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0)
      );
      for (const practical of sortedPracticals) {
        const row = [`LO-${lo.loNumber}`, practical.practicalNumber];
        let grandTotal = 0;
        for (const criteria of (practical.criteriaMarks || [])) {
          for (const sub of criteria.subCriteriaMarks) row.push(sub.allocatedMark);
          row.push(criteria.allocatedMark);
          grandTotal += criteria.allocatedMark;
        }
        row.push(grandTotal);
        body.push(row);
      }
      const avgRow = new Array(40).fill('');
      avgRow[0] = (lo.loName || '').substring(0, 30);
      avgRow[37] = `Avg LO${lo.loNumber}`;
      avgRow[38] = lo.loMark || 0;
      body.push(avgRow);
    }
    const overallAvg = sortedLOs.length > 0
      ? Math.round(sortedLOs.reduce((s, lo) => s + (lo.loMark || 0), 0) / sortedLOs.length)
      : 0;
    const finalRow = new Array(40).fill('');
    finalRow[0] = 'Average of All LOs';
    finalRow[38] = overallAvg;
    body.push(finalRow);

    autoTable(doc, {
      head, body, startY: y + 17,
      styles: { fontSize: 5, cellPadding: 0.8, valign: 'middle', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [198, 239, 206], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 5 },
      columnStyles: { 0: { cellWidth: 14, halign: 'left' }, 1: { cellWidth: 7 } },
      margin: { left: 3, right: 3 },
      tableWidth: 'auto',
    });
  }

  return doc;
};
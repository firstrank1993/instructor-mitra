import * as XLSX from 'xlsx';

/**
 * Generate sub-report marks (ES, WCS, ED)
 * All three have identical structure, only title changes
 * Columns: Roll No | Name | B(Attendance 0-5) | C(Speed 0-5) | D(Creative 0-10) | blank | E(Q1 0-20) | F(Q2 0-20) | G(Total 0-60) | H(Converted) | Sign
 */

// Random int between min and max inclusive
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Distribute subject marks (out of 30 or 10) into sub-components
 * Total out of 60, then convert back
 * Sub-components: B(3-5) + C(2-5) + D(3-9) + E(8-20) + F(8-20) = Total
 * Constraint: E ≠ F
 */
const distributeSubjectMarks = (targetMark, isOutOf30) => {
  // Convert target to out of 60
  const targetOutOf60 = isOutOf30
    ? targetMark * 2   // out of 30 → * 2 = out of 60
    : targetMark * 6;  // out of 10 → * 6 = out of 60

  let b, c, d, e, f;
  let attempts = 0;

  do {
    b = randInt(2, 5);    // Attendance
    c = randInt(2, 5);    // Speed/Accuracy
    d = randInt(3, 9);    // Creative Work

    const remaining = targetOutOf60 - b - c - d;

    if (remaining < 16 || remaining > 40) {
      attempts++;
      continue;
    }

    // Split remaining between E and F (8-20 each, E ≠ F)
    let eMin = Math.max(8, remaining - 20);
    let eMax = Math.min(20, remaining - 8);

    if (eMin > eMax) { attempts++; continue; }

    e = randInt(eMin, eMax);
    f = remaining - e;

    if (f < 8 || f > 20 || e === f) { attempts++; continue; }

    break;
  } while (attempts < 200);

  // Fallback if can't distribute
  if (attempts >= 200) {
    const total = targetOutOf60;
    b = 3; c = 3; d = 6;
    const rem = total - b - c - d;
    e = Math.min(20, Math.max(8, Math.floor(rem / 2)));
    f = rem - e;
    if (f < 8) { e = rem - 8; f = 8; }
    if (f > 20) { e = rem - 20; f = 20; }
  }

  const totalOutOf60 = b + c + d + e + f;
  const converted = isOutOf30
    ? totalOutOf60 / 2        // → out of 30
    : totalOutOf60 / 6;       // → out of 10

  return { b, c, d, e, f, totalOutOf60, converted };
};

/**
 * Generate ES/WCS/ED report Excel
 */
export const generateSubjectReport = (reportData, subjectType) => {
  const {
    trainees,
    subjectMarks, // Array of {traineeId, totalMarks} — marks already assigned
    instructorData,
    batchData,
    half,
    assessmentDate,
    tradeData,
    has5Subjects,
  } = reportData;

  const isOutOf30 = !has5Subjects && subjectType === 'ES';

  // Title based on subject
  const titles = {
    ES: 'FORMAT FOR INTERNAL ASSESSMENT FOR EMPLOYABILITY SKILLS',
    WCS: 'FORMAT FOR INTERNAL ASSESSMENT FOR WORKSHOP CALCULATION & SCIENCE',
    ED: 'FORMAT FOR INTERNAL ASSESSMENT FOR ENGINEERING DRAWING',
  };

  const reportTitles = {
    ES: 'ANNEXURE-III (FAR-2 )',
    WCS: '(FAR-2 )',
    ED: '(FAR-2 )',
  };

  const conversionLabel = isOutOf30
    ? 'Convert Total Marks in to 30 Markes =  {(Col.G)/2}'
    : 'Convert Total Marks in to 10 Markes =  {(Col.G)/6}';

  const wb = XLSX.utils.book_new();
  const wsData = [];

  // ROW 1: Report type
  wsData.push([reportTitles[subjectType]]);

  // ROW 2: Title
  wsData.push(['Internal Assessment']);

  // ROW 3: Subject title
  wsData.push([titles[subjectType]]);

  // ROW 4: Assessor + Year
  wsData.push([
    'Name & Adddress of the Assessor', '', '',
    instructorData.displayName || '',
    '', '',
    'Year of Enrolment', '', '', '',
    batchData.yearOfAssessment || '',
  ]);

  // ROW 5: ITI + Date
  wsData.push([
    'Name & Address of ITI (Govt/Pvt)', '', '',
    instructorData.itiName || '',
    '', '',
    'Date of Assessment', '', '', '',
    assessmentDate || '',
  ]);

  // ROW 6: Industry + Assessment Location
  wsData.push([
    'Name & Address of the Industry', '', '',
    instructorData.address || '',
    '', '',
    'Assessment Location', '', '', '',
    instructorData.itiName || '',
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

  // ROW 8: Learning Outcome + Batch
  wsData.push([
    'Learning Outcome :', '', '', '', '', '',
    'Batch No.:', '', '', '',
    batchData.batchNumber || '',
  ]);

  // ROW 9: Column headers
  wsData.push([
    'Roll No', 'Name', '',
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

  // ROW 10: Max marks
  wsData.push([
    'Maximum Marks =>', '', '', 5, 5, 10, '', 20, 20, 60, '', '',
  ]);

  // ROW 11: Column letters
  wsData.push(['A', '', '', 'B', 'C', 'D', '', 'E', 'F', 'G', 'H', 'I']);

  // DATA ROWS — one per trainee
  for (const trainee of trainees) {
    // Find marks for this trainee
    const markEntry = subjectMarks.find(m => m.traineeId === trainee.id);
    const targetMark = markEntry
      ? (isOutOf30 ? markEntry.totalESMarks || markEntry.totalWCSMarks || markEntry.totalEDMarks
          : markEntry.totalESMarks || markEntry.totalWCSMarks || markEntry.totalEDMarks)
      : (isOutOf30 ? 15 : 5); // Default if no marks

    const dist = distributeSubjectMarks(targetMark, isOutOf30);
    const convertedDisplay = isOutOf30
      ? dist.converted
      : parseFloat(dist.converted.toFixed(2));

    wsData.push([
      trainee.enrollmentNumber || '',
      trainee.name || '',
      '',
      dist.b,
      dist.c,
      dist.d,
      '',
      dist.e,
      dist.f,
      dist.totalOutOf60,
      convertedDisplay,
      '', // Sign
    ]);
  }

  // Blank row
  wsData.push(['']);

  // Sign row
  wsData.push([
    '', 'Sign of SI :                                                            Sign of FI :',
  ]);
  wsData.push(['', instructorData.displayName || '']);
  wsData.push([
    '', instructorData.itiName || '',
    '', '', '', '', '',
    instructorData.itiName || '',
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 10 }, // Roll No
    { wch: 35 }, // Name
    { wch: 5 },  // blank
    { wch: 12 }, // Attendance
    { wch: 30 }, // Speed/Accuracy
    { wch: 30 }, // Creative Work
    { wch: 5 },  // blank
    { wch: 14 }, // Q1
    { wch: 14 }, // Q2
    { wch: 10 }, // Total
    { wch: 35 }, // Converted
    { wch: 15 }, // Sign
  ];

  const sheetName = `${subjectType}_Report`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return wb;
};
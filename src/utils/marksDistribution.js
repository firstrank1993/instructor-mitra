/**
 * INSTRUCTOR MITRA — MARKS DISTRIBUTION ENGINE
 * Fixed 4-Level distribution with proper validation
 */

// ================================================
// CORE HELPER: Distribute total across n items
// Each item between min and max, sum = total exactly
// ================================================
const distributeExact = (total, count, min, max) => {
  if (count === 0) return [];
  if (count === 1) return [Math.max(min, Math.min(max, total))];

  // Validate feasibility
  const feasibleMin = min * count;
  const feasibleMax = max * count;

  if (total < feasibleMin) total = feasibleMin;
  if (total > feasibleMax) total = feasibleMax;

  let result = new Array(count).fill(min);
  let remaining = total - (min * count);

  // Shuffle order for variation
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Distribute remaining
  for (const idx of indices) {
    if (remaining <= 0) break;
    const canAdd = max - result[idx];
    const add = Math.min(canAdd, remaining);
    result[idx] += add;
    remaining -= add;
  }

  // If still remaining (shouldn't happen but safety check)
  if (remaining > 0) {
    for (let i = 0; i < count && remaining > 0; i++) {
      const canAdd = max - result[i];
      if (canAdd > 0) {
        const add = Math.min(canAdd, remaining);
        result[i] += add;
        remaining -= add;
      }
    }
  }

  return result;
};

// ================================================
// Distribute with minimum 1 per item (for criteria)
// CRITICAL: Sum of result MUST equal total exactly
// ================================================
const distributeMinOne = (total, maxValues) => {
  const count = maxValues.length;
  if (count === 0) return [];
  if (count === 1) return [Math.min(total, maxValues[0])];

  // Each item gets minimum 1
  if (total <= 0) return new Array(count).fill(0);
  if (total < count) {
    // Not enough to give everyone 1
    const result = new Array(count).fill(0);
    let rem = total;
    for (let i = 0; i < count && rem > 0; i++) {
      result[i] = 1;
      rem--;
    }
    return result;
  }

  // Start with 1 for each
  let result = new Array(count).fill(1);
  let remaining = total - count;

  // Shuffle for variation
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Add remaining marks respecting max values
  for (const idx of indices) {
    if (remaining <= 0) break;
    const canAdd = maxValues[idx] - result[idx]; // max - current
    const add = Math.min(canAdd, remaining);
    if (add > 0) {
      result[idx] += add;
      remaining -= add;
    }
  }

  // CRITICAL VALIDATION: verify sum equals total
  const currentSum = result.reduce((a, b) => a + b, 0);
  if (currentSum !== total) {
    // Force correction on first item that has room
    const diff = total - currentSum;
    for (let i = 0; i < count; i++) {
      const newVal = result[i] + diff;
      if (newVal >= 1 && newVal <= maxValues[i]) {
        result[i] = newVal;
        break;
      }
    }
  }

  return result;
};

// ================================================
// LEVEL 3 & 4: Distribute practical mark to criteria
// and sub-criteria with GUARANTEED sum matching
// ================================================
const distributeToCriteria = (practicalMark, criteriaList) => {
  if (!criteriaList || criteriaList.length === 0) return [];
  if (practicalMark <= 0) return criteriaList.map(c => ({
    criteriaId: c.id,
    criteriaName: c.name,
    maxMarks: c.maxMarks,
    allocatedMark: 0,
    subCriteriaMarks: c.subCriteria.map(s => ({
      subId: s.subId,
      subName: s.name,
      maxMarks: s.maxMarks,
      allocatedMark: 0,
    })),
  }));

  const count = criteriaList.length;
  const maxMarks = criteriaList.map(c => c.maxMarks);
  const totalMax = maxMarks.reduce((a, b) => a + b, 0);

  // Scale practical mark if needed
  const scaledMark = Math.min(practicalMark, totalMax);

  // Distribute marks to criteria using min=1
  const criteriaAllocations = distributeMinOne(scaledMark, maxMarks);

  // VALIDATE criteria sum
  const criteriaSum = criteriaAllocations.reduce((a, b) => a + b, 0);
  if (criteriaSum !== scaledMark) {
    // Force fix
    const diff = scaledMark - criteriaSum;
    criteriaAllocations[0] += diff;
  }

  return criteriaList.map((criteria, idx) => {
    const allocatedMark = criteriaAllocations[idx];

    // LEVEL 4: Distribute criteria mark to sub-criteria
    const subMaxMarks = criteria.subCriteria.map(s => s.maxMarks);
    const subAllocations = distributeMinOne(allocatedMark, subMaxMarks);

    // VALIDATE sub-criteria sum matches criteria mark
    const subSum = subAllocations.reduce((a, b) => a + b, 0);
    if (subSum !== allocatedMark) {
      // Force fix on first sub that has room
      const diff = allocatedMark - subSum;
      for (let i = 0; i < subAllocations.length; i++) {
        const newVal = subAllocations[i] + diff;
        if (newVal >= 1 && newVal <= subMaxMarks[i]) {
          subAllocations[i] = newVal;
          break;
        } else if (newVal >= 1) {
          subAllocations[i] = newVal;
          break;
        }
      }
    }

    return {
      criteriaId: criteria.id,
      criteriaName: criteria.name,
      maxMarks: criteria.maxMarks,
      allocatedMark,
      subCriteriaMarks: criteria.subCriteria.map((sub, sIdx) => ({
        subId: sub.subId,
        subName: sub.name,
        maxMarks: sub.maxMarks,
        allocatedMark: subAllocations[sIdx],
      })),
    };
  });
};

// ================================================
// LEVEL 1 & 2: Main distribution function
// ================================================
export const distributeMarks = (inputMark, los, criteriaList, half) => {
  const LO_MIN = 61;
  const LO_MAX = 95;

  if (!los || los.length === 0) {
    return { inputMark, loDistribution: [], error: 'No LOs found' };
  }

  // Adjust range based on input
  const effectiveMin = inputMark < LO_MIN ? Math.max(0, inputMark - 5) : LO_MIN;
  const effectiveMax = inputMark > LO_MAX ? Math.min(100, inputMark + 5) : LO_MAX;

  const loCount = los.length;

  // LEVEL 1: Distribute input mark across LOs
  // Average of LO marks must equal inputMark exactly
  const loTotal = inputMark * loCount;
  const loMarks = distributeExact(loTotal, loCount, effectiveMin, effectiveMax);

  // Verify LO average
  const loSum = loMarks.reduce((a, b) => a + b, 0);
  const loAvg = loSum / loCount;

  // Fix if average doesn't match (floating point issues)
  if (Math.round(loAvg) !== inputMark) {
    const diff = (inputMark * loCount) - loSum;
    loMarks[0] += diff;
  }

  const loDistribution = los.map((lo, loIdx) => {
    const loMark = loMarks[loIdx];
    const practicals = lo.practicals || [];
    const practicalCount = practicals.length;

    if (practicalCount === 0) {
      return {
        loId: lo.id,
        loName: lo.loName,
        loNumber: lo.loNumber,
        loMark,
        practicalDistribution: [],
      };
    }

    // LEVEL 2: Distribute LO mark across practicals
    // Average of practical marks must equal loMark exactly
    const practicalTotal = loMark * practicalCount;
    const practicalMarks = distributeExact(
      practicalTotal,
      practicalCount,
      effectiveMin,
      effectiveMax
    );

    // Verify practical average
    const practicalSum = practicalMarks.reduce((a, b) => a + b, 0);
    if (practicalSum !== practicalTotal) {
      const diff = practicalTotal - practicalSum;
      practicalMarks[0] += diff;
    }

    const practicalDistribution = practicals.map((practical, pIdx) => {
      const practicalMark = practicalMarks[pIdx];

      // LEVEL 3 & 4: Distribute to criteria and sub-criteria
      const criteriaMarks = distributeToCriteria(practicalMark, criteriaList);

      // FINAL VALIDATION: criteria sum must equal practicalMark
      const criteriaTotal = criteriaMarks.reduce((sum, c) => sum + c.allocatedMark, 0);
      if (criteriaTotal !== practicalMark && criteriaMarks.length > 0) {
        const diff = practicalMark - criteriaTotal;
        criteriaMarks[0].allocatedMark += diff;
        // Also fix sub-criteria of first criteria
        if (criteriaMarks[0].subCriteriaMarks.length > 0) {
          criteriaMarks[0].subCriteriaMarks[0].allocatedMark += diff;
        }
      }

      return {
        practicalId: practical.id,
        practicalName: practical.practicalName,
        practicalNumber: practical.practicalNumber,
        loId: lo.id,
        half,
        practicalMark,
        criteriaMarks,
      };
    });

    return {
      loId: lo.id,
      loName: lo.loName,
      loNumber: lo.loNumber,
      loMark,
      practicalDistribution,
    };
  });

  return {
    inputMark,
    loDistribution,
    error: null,
  };
};

// ================================================
// CONVERT TP MARKS (out of 70 to out of 100)
// ================================================
export const convertTPMarks = (tpMarksOutOf70) => {
  return Math.round((tpMarksOutOf70 / 70) * 100);
};

// ================================================
// DISTRIBUTE SUBJECT MARKS (ES, ED, WCS)
// ================================================
export const distributeSubjectMarks = (totalMark, tpMarks, subjects) => {
  const hasED = subjects.includes('ED');
  const hasWCS = subjects.includes('WCS');
  const hasES = subjects.includes('ES');

  if (!hasED && !hasWCS) {
    // 3 subject trade: ES = total - TP
    const esMarks = Math.max(0, Math.min(30, totalMark - tpMarks));
    return { esMarks, edMarks: null, wcsMarks: null };
  }

  if (hasED && hasWCS && hasES) {
    // 5 subject trade: ES + ED + WCS = total - TP (out of 30)
    const remaining = totalMark - tpMarks;

    let esM, edM, wcsM;
    let attempts = 0;

    while (attempts < 500) {
      esM = Math.floor(Math.random() * 6) + 4; // 4-9
      edM = Math.floor(Math.random() * 6) + 4; // 4-9
      wcsM = remaining - esM - edM;
      if (wcsM >= 4 && wcsM <= 9 && esM !== edM && edM !== wcsM && esM !== wcsM) break;
      attempts++;
    }

    if (attempts >= 500) {
      // Fallback
      esM = Math.round(remaining / 3);
      edM = Math.round(remaining / 3);
      wcsM = remaining - esM - edM;
      esM = Math.max(4, Math.min(9, esM));
      edM = Math.max(4, Math.min(9, edM));
      wcsM = Math.max(4, Math.min(9, wcsM));
    }

    return { esMarks: esM, edMarks: edM, wcsMarks: wcsM };
  }

  return { esMarks: null, edMarks: null, wcsMarks: null };
};

// ================================================
// MAIN: Distribute marks for ALL trainees
// ================================================
export const distributeAllTrainees = (
  traineeMarks,
  los,
  criteriaList,
  half,
  entryType,
  subjects
) => {
  const results = [];

  for (const trainee of traineeMarks) {
    let tpMark100;

    if (entryType === 'case1') {
      const inputMark = trainee.inputMark || 0;
      const tpMarks70 = Math.round((inputMark / 100) * 70);
      tpMark100 = inputMark;

      const subjectDist = distributeSubjectMarks(inputMark, tpMarks70, subjects);
      const tpDist = distributeMarks(tpMark100, los, criteriaList, half);

      results.push({
        traineeId: trainee.traineeId,
        traineeName: trainee.traineeName,
        entryType: 'case1',
        inputMark,
        tpMarks70,
        esMarks: subjectDist.esMarks,
        edMarks: subjectDist.edMarks,
        wcsMarks: subjectDist.wcsMarks,
        totalMarks: inputMark,
        tpDistribution: tpDist,
        loDistribution: tpDist.loDistribution,
      });

    } else {
      // Case 2: subject-wise marks
      const tpMarks70 = trainee.tpMarks || 0;
      tpMark100 = convertTPMarks(tpMarks70);

      const totalMarks = tpMarks70 +
        (trainee.esMarks || 0) +
        (trainee.edMarks || 0) +
        (trainee.wcsMarks || 0);

      const tpDist = distributeMarks(tpMark100, los, criteriaList, half);

      results.push({
        traineeId: trainee.traineeId,
        traineeName: trainee.traineeName,
        entryType: 'case2',
        tpMarks70,
        tpMark100,
        esMarks: trainee.esMarks || 0,
        edMarks: trainee.edMarks || null,
        wcsMarks: trainee.wcsMarks || null,
        totalMarks,
        tpDistribution: tpDist,
        loDistribution: tpDist.loDistribution,
      });
    }
  }

  return results;
};
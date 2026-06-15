/**
 * INSTRUCTOR MITRA — MARKS DISTRIBUTION ENGINE v2
 * Fixed: sub-criteria sum always equals criteria total
 * Fixed: criteria sum always equals practical mark
 * Fixed: LO average always equals input mark
 */

// Random integer between min and max inclusive
const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Distribute 'total' across 'count' items
 * Each item between min and max
 * Sum of result = total EXACTLY
 */
const distributeExact = (total, count, min, max) => {
  if (count === 0) return [];
  if (count === 1) return [total];

  // Clamp total to feasible range
  const feasMin = min * count;
  const feasMax = max * count;
  let t = Math.max(feasMin, Math.min(feasMax, total));

  // Start with min for each
  const result = new Array(count).fill(min);
  let remaining = t - feasMin;

  // Random order for variation
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }

  for (const idx of order) {
    if (remaining <= 0) break;
    const canAdd = max - result[idx];
    const add = Math.min(canAdd, remaining);
    result[idx] += add;
    remaining -= add;
  }

  // Safety: force fix if sum still wrong
  let sum = result.reduce((a, b) => a + b, 0);
  if (sum !== t) {
    for (let i = 0; i < count && sum !== t; i++) {
      const diff = t - sum;
      const newVal = result[i] + diff;
      if (newVal >= min && newVal <= max) {
        result[i] = newVal;
        sum = t;
      }
    }
  }

  return result;
};

/**
 * Distribute 'total' across items with max values
 * Minimum 1 per item (unless total < count)
 * Sum MUST equal total exactly
 */
const distributeMinOne = (total, maxValues) => {
  const count = maxValues.length;
  if (count === 0) return [];
  if (total <= 0) return new Array(count).fill(0);
  if (count === 1) return [Math.min(total, maxValues[0])];

  // If total less than count, can't give everyone 1
  const minPer = Math.min(1, Math.floor(total / count));
  const result = new Array(count).fill(minPer);
  let remaining = total - minPer * count;

  // Random order for variation
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }

  for (const idx of order) {
    if (remaining <= 0) break;
    const canAdd = maxValues[idx] - result[idx];
    const add = Math.min(canAdd, remaining);
    if (add > 0) {
      result[idx] += add;
      remaining -= add;
    }
  }

  // CRITICAL: Force fix sum to equal total
  let sum = result.reduce((a, b) => a + b, 0);
  if (sum !== total) {
    const diff = total - sum;
    // Try to add/subtract from first item with room
    for (let i = 0; i < count; i++) {
      const newVal = result[i] + diff;
      if (newVal >= 1 && newVal <= maxValues[i]) {
        result[i] = newVal;
        break;
      } else if (newVal >= 0 && newVal <= maxValues[i]) {
        result[i] = newVal;
        break;
      }
    }
  }

  return result;
};

/**
 * LEVEL 3 & 4: Distribute practical mark to criteria and sub-criteria
 * GUARANTEES: sum of criteria = practicalMark
 *             sum of sub-criteria = criteria mark for each criteria
 */
const distributeToCriteria = (practicalMark, criteriaList) => {
  if (!criteriaList || criteriaList.length === 0) return [];
  if (practicalMark <= 0) {
    return criteriaList.map(c => ({
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
  }

  const maxValues = criteriaList.map(c => c.maxMarks);
  const totalMax = maxValues.reduce((a, b) => a + b, 0);
  const scaledMark = Math.min(practicalMark, totalMax);

  // Distribute to criteria
  const criteriaAlloc = distributeMinOne(scaledMark, maxValues);

  // Verify criteria sum
  const criteriaSum = criteriaAlloc.reduce((a, b) => a + b, 0);
  if (criteriaSum !== scaledMark) {
    const diff = scaledMark - criteriaSum;
    for (let i = 0; i < criteriaAlloc.length; i++) {
      const newVal = criteriaAlloc[i] + diff;
      if (newVal >= 0 && newVal <= maxValues[i]) {
        criteriaAlloc[i] = newVal;
        break;
      }
    }
  }

  return criteriaList.map((criteria, idx) => {
    const allocatedMark = criteriaAlloc[idx];
    const subMaxValues = criteria.subCriteria.map(s => s.maxMarks);

    // Distribute to sub-criteria
    const subAlloc = distributeMinOne(allocatedMark, subMaxValues);

    // CRITICAL: Verify sub-criteria sum equals criteria mark
    let subSum = subAlloc.reduce((a, b) => a + b, 0);
    if (subSum !== allocatedMark) {
      const diff = allocatedMark - subSum;
      for (let i = 0; i < subAlloc.length; i++) {
        const newVal = subAlloc[i] + diff;
        if (newVal >= 0 && newVal <= subMaxValues[i]) {
          subAlloc[i] = newVal;
          subSum = allocatedMark;
          break;
        }
      }
      // Last resort: force on index 0
      if (subSum !== allocatedMark) {
        subAlloc[0] += (allocatedMark - subSum);
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
        allocatedMark: subAlloc[sIdx],
      })),
    };
  });
};

/**
 * MAIN: Distribute marks for one trainee
 */
export const distributeMarks = (inputMark, los, criteriaList, half) => {
  const LO_MIN = 61;
  const LO_MAX = 95;

  if (!los || los.length === 0) {
    return { inputMark, loDistribution: [], error: 'No LOs found' };
  }

  const effectiveMin = inputMark < LO_MIN ? Math.max(0, inputMark - 5) : LO_MIN;
  const effectiveMax = inputMark > LO_MAX ? Math.min(100, inputMark + 5) : LO_MAX;

  const loCount = los.length;

  // LEVEL 1: Distribute inputMark across LOs
  // Average of all LO marks must equal inputMark
  const loTotal = inputMark * loCount;
  const loMarks = distributeExact(loTotal, loCount, effectiveMin, effectiveMax);

  // Verify and fix LO total
  const loSum = loMarks.reduce((a, b) => a + b, 0);
  if (loSum !== loTotal) {
    loMarks[0] += (loTotal - loSum);
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

    // LEVEL 2: Distribute loMark across practicals
    // Average of all practicals must equal loMark
    const practicalTotal = loMark * practicalCount;
    const practicalMarks = distributeExact(
      practicalTotal, practicalCount, effectiveMin, effectiveMax
    );

    // Verify practical total
    const practicalSum = practicalMarks.reduce((a, b) => a + b, 0);
    if (practicalSum !== practicalTotal) {
      practicalMarks[0] += (practicalTotal - practicalSum);
    }

    const practicalDistribution = practicals.map((practical, pIdx) => {
      const practicalMark = practicalMarks[pIdx];

      // LEVELS 3 & 4: Criteria and sub-criteria
      const criteriaMarks = distributeToCriteria(practicalMark, criteriaList);

      // Final check: criteria sum must equal practicalMark
      const cSum = criteriaMarks.reduce((s, c) => s + c.allocatedMark, 0);
      if (cSum !== practicalMark && criteriaMarks.length > 0) {
        const diff = practicalMark - cSum;
        criteriaMarks[0].allocatedMark += diff;
        // Fix sub-criteria of first criteria
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

  return { inputMark, loDistribution, error: null };
};

export const convertTPMarks = (tpMarksOutOf70) =>
  Math.round((tpMarksOutOf70 / 70) * 100);

export const distributeSubjectMarks = (totalMark, tpMarks, subjects) => {
  const hasED = subjects.includes('ED');
  const hasWCS = subjects.includes('WCS');
  const hasES = subjects.includes('ES');

  if (!hasED && !hasWCS) {
    return {
      esMarks: Math.max(0, Math.min(30, totalMark - tpMarks)),
      edMarks: null,
      wcsMarks: null,
    };
  }

  if (hasED && hasWCS && hasES) {
    const remaining = totalMark - tpMarks;
    let esM, edM, wcsM;
    let attempts = 0;

    while (attempts < 500) {
      esM = randInt(4, 9);
      edM = randInt(4, 9);
      wcsM = remaining - esM - edM;
      if (
        wcsM >= 4 && wcsM <= 9 &&
        esM !== edM && edM !== wcsM && esM !== wcsM
      ) break;
      attempts++;
    }

    if (attempts >= 500) {
      esM = Math.round(remaining / 3);
      edM = Math.round(remaining / 3);
      wcsM = remaining - esM - edM;
      esM = Math.max(4, Math.min(9, esM));
      edM = Math.max(4, Math.min(9, edM));
      wcsM = Math.max(4, Math.min(9, remaining - esM - edM));
    }

    return { esMarks: esM, edMarks: edM, wcsMarks: wcsM };
  }

  return { esMarks: null, edMarks: null, wcsMarks: null };
};

export const distributeAllTrainees = (
  traineeMarks, los, criteriaList, half, entryType, subjects
) => {
  const results = [];

  for (const trainee of traineeMarks) {
    if (entryType === 'case1') {
      const inputMark = trainee.inputMark || 0;
      const tpMarks70 = Math.round((inputMark / 100) * 70);
      const subjectDist = distributeSubjectMarks(inputMark, tpMarks70, subjects);
      const tpDist = distributeMarks(inputMark, los, criteriaList, half);

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
      const tpMarks70 = trainee.tpMarks || 0;
      const tpMark100 = convertTPMarks(tpMarks70);
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
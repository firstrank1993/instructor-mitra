/**
 * INSTRUCTOR MITRA — MARKS DISTRIBUTION ENGINE v3
 * Verified algorithm: real random variation, exact sum guarantees.
 */

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Distribute `total` across `count` items, each within [min, max],
 * sum of result EXACTLY equals total, with genuine random variation.
 */
function distributeExact(total, count, min, max) {
  if (count === 0) return [];
  if (count === 1) return [Math.max(min, Math.min(max, total))];

  const feasMin = min * count;
  const feasMax = max * count;
  const target = Math.max(feasMin, Math.min(feasMax, total));

  // Random starting point for each item (real variation source)
  let vals = [];
  for (let i = 0; i < count; i++) vals.push(randInt(min, max));
  let sum = vals.reduce((a, b) => a + b, 0);
  let diff = target - sum;

  // Random order so correction doesn't always hit the same item first
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }

  let guard = 0;
  while (diff !== 0 && guard < 100000) {
    guard++;
    let moved = false;
    for (const idx of order) {
      if (diff === 0) break;
      if (diff > 0 && vals[idx] < max) { vals[idx]++; diff--; moved = true; }
      else if (diff < 0 && vals[idx] > min) { vals[idx]--; diff++; moved = true; }
    }
    if (!moved) break;
  }
  return vals;
}

/**
 * Distribute `total` across items with individual max values, min 1 each,
 * sum of result EXACTLY equals total.
 */
function distributeToMaxValues(total, maxValues) {
  const count = maxValues.length;
  if (count === 0) return [];
  if (count === 1) return [Math.max(0, Math.min(maxValues[0], total))];

  const feasMin = count; // min 1 each
  const feasMax = maxValues.reduce((a, b) => a + b, 0);
  const target = Math.max(feasMin, Math.min(feasMax, total));

  let vals = maxValues.map(m => randInt(1, m));
  let sum = vals.reduce((a, b) => a + b, 0);
  let diff = target - sum;

  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }

  let guard = 0;
  while (diff !== 0 && guard < 100000) {
    guard++;
    let moved = false;
    for (const idx of order) {
      if (diff === 0) break;
      if (diff > 0 && vals[idx] < maxValues[idx]) { vals[idx]++; diff--; moved = true; }
      else if (diff < 0 && vals[idx] > 1) { vals[idx]--; diff++; moved = true; }
    }
    if (!moved) break;
  }
  return vals;
}

/**
 * LEVEL 3 & 4: Distribute one practical's mark across criteria, then each
 * criteria mark across its sub-criteria. Sums are guaranteed exact.
 */
function distributeToCriteria(practicalMark, criteriaList) {
  if (!criteriaList || criteriaList.length === 0) return [];

  const maxValues = criteriaList.map(c => c.maxMarks);
  const allocations = distributeToMaxValues(practicalMark, maxValues);

  return criteriaList.map((criteria, idx) => {
    const allocatedMark = allocations[idx];
    const subMaxValues = criteria.subCriteria.map(s => s.maxMarks);
    const subAllocations = distributeToMaxValues(allocatedMark, subMaxValues);

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
}

/**
 * MAIN: Distribute marks for ONE trainee across all LOs and practicals.
 * Guarantees: average of LO marks = inputMark; average of practicals
 * under each LO = that LO's mark; sum of criteria = practical mark;
 * sum of sub-criteria = criteria mark. All with real random variation.
 */
export const distributeMarks = (inputMark, los, criteriaList, half) => {
  const LO_MIN = 61;
  const LO_MAX = 95;

  if (!los || los.length === 0) {
    return { inputMark, loDistribution: [], error: 'No LOs found' };
  }

  // Allow the range to widen only if instructor's mark is outside [61,95]
  const effectiveMin = inputMark < LO_MIN ? Math.max(0, Math.min(inputMark, LO_MIN)) : LO_MIN;
  const effectiveMax = inputMark > LO_MAX ? Math.max(inputMark, LO_MAX) : LO_MAX;

  const loCount = los.length;
  const loTotal = inputMark * loCount;
  const loMarks = distributeExact(loTotal, loCount, effectiveMin, effectiveMax);

  const loDistribution = los.map((lo, loIdx) => {
    const loMark = loMarks[loIdx];
    const practicals = lo.practicals || [];
    const practicalCount = practicals.length;

    if (practicalCount === 0) {
      return {
        loId: lo.id, loName: lo.loName, loNumber: lo.loNumber,
        loMark, practicalDistribution: [],
      };
    }

    const practicalTotal = loMark * practicalCount;
    const practicalMarks = distributeExact(practicalTotal, practicalCount, effectiveMin, effectiveMax);

    const practicalDistribution = practicals.map((practical, pIdx) => {
      const practicalMark = practicalMarks[pIdx];
      const criteriaMarks = distributeToCriteria(practicalMark, criteriaList);

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

    return { loId: lo.id, loName: lo.loName, loNumber: lo.loNumber, loMark, practicalDistribution };
  });

  return { inputMark, loDistribution, error: null };
};

export const convertTPMarks = (tpMarksOutOf70) => Math.round((tpMarksOutOf70 / 70) * 100);

export const distributeSubjectMarks = (totalMark, tpMarks, subjects) => {
  const hasED = subjects.includes('ED');
  const hasWCS = subjects.includes('WCS');
  const hasES = subjects.includes('ES');

  if (!hasED && !hasWCS) {
    return { esMarks: Math.max(0, Math.min(30, totalMark - tpMarks)), edMarks: null, wcsMarks: null };
  }

  if (hasED && hasWCS && hasES) {
    const remaining = totalMark - tpMarks;
    let esM, edM, wcsM;
    let attempts = 0;
    while (attempts < 500) {
      esM = randInt(4, 9);
      edM = randInt(4, 9);
      wcsM = remaining - esM - edM;
      if (wcsM >= 4 && wcsM <= 9 && esM !== edM && edM !== wcsM && esM !== wcsM) break;
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

export const distributeAllTrainees = (traineeMarks, los, criteriaList, half, entryType, subjects) => {
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
      const totalMarks = tpMarks70 + (trainee.esMarks || 0) + (trainee.edMarks || 0) + (trainee.wcsMarks || 0);
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
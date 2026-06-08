/**
 * INSTRUCTOR MITRA — MARKS DISTRIBUTION ENGINE
 * 4-Level automatic distribution with validation
 */

// ================================================
// HELPER FUNCTIONS
// ================================================

// Random integer between min and max (inclusive)
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Distribute a total value across n items
// Each item gets between min and max
// Sum of all items = total (exactly)
const distributeWithVariation = (total, count, min, max) => {
  if (count === 0) return [];
  if (count === 1) return [total];

  // Clamp total to valid range
  const validMin = min * count;
  const validMax = max * count;
  const clampedTotal = Math.max(validMin, Math.min(validMax, total));

  let result = [];
  let remaining = clampedTotal;

  for (let i = 0; i < count - 1; i++) {
    const itemsLeft = count - i;
    const remainingMin = min * itemsLeft;
    const remainingMax = max * itemsLeft;

    // Calculate valid range for this item
    const itemMin = Math.max(min, remaining - (remainingMax - max));
    const itemMax = Math.min(max, remaining - (remainingMin - min));

    // Add variation — don't always pick the middle
    const value = randomInt(
      Math.max(min, itemMin),
      Math.min(max, itemMax)
    );

    result.push(value);
    remaining -= value;
  }

  result.push(remaining);

  // Shuffle for more variation
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

// Distribute total across items with min=1 (for criteria/sub-criteria)
const distributeMinOne = (total, maxValues) => {
  const count = maxValues.length;
  if (count === 0) return [];
  if (count === 1) return [Math.min(total, maxValues[0])];

  let result = new Array(count).fill(1);
  let remaining = total - count; // Already assigned 1 to each

  // Randomly distribute remaining
  const indices = Array.from({ length: count }, (_, i) => i);

  // Shuffle indices for random order
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (const idx of indices) {
    if (remaining <= 0) break;
    const canAdd = maxValues[idx] - result[idx];
    const add = Math.min(canAdd, remaining);
    result[idx] += add;
    remaining -= add;
  }

  return result;
};

// ================================================
// VALIDATION
// ================================================

export const validateDistribution = (distributed, criteriaList) => {
  const errors = [];

  for (const practical of distributed) {
    // Check criteria sum = practical mark
    const criteriaSum = practical.criteriaMarks.reduce(
      (sum, c) => sum + c.allocatedMark, 0
    );
    if (criteriaSum !== practical.practicalMark) {
      errors.push(`Practical ${practical.practicalId}: criteria sum ${criteriaSum} ≠ ${practical.practicalMark}`);
    }

    for (const criteria of practical.criteriaMarks) {
      // No zeros in criteria
      if (criteria.allocatedMark === 0) {
        errors.push(`Criteria ${criteria.criteriaId} has 0 marks`);
      }

      // Check sub-criteria sum = criteria mark
      const subSum = criteria.subCriteriaMarks.reduce(
        (sum, s) => sum + s.allocatedMark, 0
      );
      if (subSum !== criteria.allocatedMark) {
        errors.push(`Criteria ${criteria.criteriaId}: sub sum ${subSum} ≠ ${criteria.allocatedMark}`);
      }

      for (const sub of criteria.subCriteriaMarks) {
        // No zeros in sub-criteria
        if (sub.allocatedMark === 0) {
          errors.push(`Sub-criteria ${sub.subId} has 0 marks`);
        }
      }
    }
  }

  return errors;
};

// ================================================
// LEVEL 3 & 4: Distribute practical mark to criteria and sub-criteria
// ================================================

const distributeToCriteria = (practicalMark, criteriaList) => {
  const count = criteriaList.length;
  const maxMarks = criteriaList.map(c => c.maxMarks);
  const totalMax = maxMarks.reduce((sum, m) => sum + m, 0);

  // Scale practical mark to total max if needed
  const scaledMark = Math.min(practicalMark, totalMax);

  // Distribute with min=1
  const criteriaAllocations = distributeMinOne(scaledMark, maxMarks);

  return criteriaList.map((criteria, idx) => {
    const allocatedMark = criteriaAllocations[idx];

    // Level 4: Distribute criteria mark to sub-criteria
    const subMaxMarks = criteria.subCriteria.map(s => s.maxMarks);
    const subAllocations = distributeMinOne(allocatedMark, subMaxMarks);

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
// MAIN DISTRIBUTION FUNCTION
// ================================================

/**
 * Distribute marks for a single trainee
 * @param {number} inputMark - The mark entered by instructor (0-100)
 * @param {Array} los - Array of LO objects with their practicals
 * @param {Array} criteriaList - Assessment criteria from Firestore
 * @param {string} half - H1, H2, H3, or H4
 * @returns {Object} - Complete distribution result
 */
export const distributeMarks = (inputMark, los, criteriaList, half) => {
  const LO_MIN = 61;
  const LO_MAX = 95;

  // Adjust range if input violates bounds
  const effectiveMin = inputMark < LO_MIN ? inputMark : LO_MIN;
  const effectiveMax = inputMark > LO_MAX ? inputMark : LO_MAX;

  const loCount = los.length;
  if (loCount === 0) return { loDistribution: [], error: 'No LOs found' };

  // ================================================
  // LEVEL 1: Distribute input mark across LOs
  // Average of LO marks = inputMark (exactly)
  // ================================================
  const loTotal = inputMark * loCount;
  const loMarks = distributeWithVariation(
    loTotal,
    loCount,
    effectiveMin,
    effectiveMax
  );

  // Verify average
  const loAvg = loMarks.reduce((sum, m) => sum + m, 0) / loCount;

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

    // ================================================
    // LEVEL 2: Distribute LO mark across practicals
    // Average of practical marks = loMark (exactly)
    // ================================================
    const practicalTotal = loMark * practicalCount;
    const practicalMarks = distributeWithVariation(
      practicalTotal,
      practicalCount,
      effectiveMin,
      effectiveMax
    );

    const practicalDistribution = practicals.map((practical, pIdx) => {
      const practicalMark = practicalMarks[pIdx];

      // ================================================
      // LEVEL 3 & 4: Distribute to criteria and sub-criteria
      // ================================================
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
// CONVERT MARKS FOR SUBJECTS
// ================================================

/**
 * Convert TP marks from out of 70 to out of 100
 */
export const convertTPMarks = (tpMarksOutOf70) => {
  return Math.round((tpMarksOutOf70 / 70) * 100);
};

/**
 * Distribute remaining marks to ES, ED, WCS for 5-subject trades
 * Total of ES + ED + WCS out of 30, each between 4-9 out of 10
 * Sum must equal total - TP marks
 */
export const distributeSubjectMarks = (totalMark, tpMarks, subjects) => {
  const hasED = subjects.includes('ED');
  const hasWCS = subjects.includes('WCS');
  const hasES = subjects.includes('ES');

  // 3 subject trade (TP + ES only assessable)
  if (!hasED && !hasWCS) {
    const esMarks = totalMark - tpMarks;
    return {
      esMarks: Math.min(esMarks, 30),
      edMarks: null,
      wcsMarks: null,
    };
  }

  // 5 subject trade (TP + ES + ED + WCS)
  if (hasED && hasWCS && hasES) {
    const remaining = totalMark - tpMarks; // out of 30
    // Each subject out of 10, range 4-9
    // Sum must = remaining

    let esM, edM, wcsM;
    let attempts = 0;

    do {
      esM = randomInt(4, 9);
      edM = randomInt(4, 9);
      wcsM = remaining - esM - edM;
      attempts++;
    } while ((wcsM < 4 || wcsM > 9) && attempts < 100);

    // If still invalid after 100 attempts, force it
    if (wcsM < 4 || wcsM > 9) {
      esM = Math.round(remaining / 3);
      edM = Math.round(remaining / 3);
      wcsM = remaining - esM - edM;
      // Clamp
      esM = Math.max(4, Math.min(9, esM));
      edM = Math.max(4, Math.min(9, edM));
      wcsM = remaining - esM - edM;
    }

    return {
      esMarks: esM,
      edMarks: edM,
      wcsMarks: wcsM,
    };
  }

  return {
    esMarks: null,
    edMarks: null,
    wcsMarks: null,
  };
};

// ================================================
// BATCH DISTRIBUTION FOR ALL TRAINEES
// ================================================

/**
 * Distribute marks for all trainees
 * @param {Array} traineeMarks - Array of {traineeId, inputMark} or {traineeId, tpMarks, esMarks, edMarks, wcsMarks}
 * @param {Array} los - LOs with practicals
 * @param {Array} criteriaList - Assessment criteria
 * @param {string} half - H1/H2/H3/H4
 * @param {string} entryType - 'case1' or 'case2'
 * @param {Array} subjects - Trade subjects
 */
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
    let tpMark100; // TP marks out of 100 for distribution

    if (entryType === 'case1') {
      // Case 1: Single percentage input
      const inputMark = trainee.inputMark;

      // Get subject distribution
      const subjectDist = distributeSubjectMarks(
        inputMark,
        Math.round((inputMark / 100) * 70), // TP out of 70
        subjects
      );

      // Convert TP to out of 100 for distribution
      tpMark100 = inputMark; // In case 1, input IS the percentage

      results.push({
        traineeId: trainee.traineeId,
        traineeName: trainee.traineeName,
        entryType: 'case1',
        inputMark,
        tpMarks70: Math.round((inputMark / 100) * 70),
        esMarks: subjectDist.esMarks,
        edMarks: subjectDist.edMarks,
        wcsMarks: subjectDist.wcsMarks,
        totalMarks: inputMark,
        tpDistribution: distributeMarks(tpMark100, los, criteriaList, half),
      });
    } else {
      // Case 2: Subject-wise marks input
      const tpMarks70 = trainee.tpMarks || 0;
      tpMark100 = convertTPMarks(tpMarks70);

      const totalMarks = tpMarks70 +
        (trainee.esMarks || 0) +
        (trainee.edMarks || 0) +
        (trainee.wcsMarks || 0);

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
        tpDistribution: distributeMarks(tpMark100, los, criteriaList, half),
      });
    }
  }

  return results;
};
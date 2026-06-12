import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { delay } from '../lib/utils';
import { BATCH_WRITE_SIZE, BATCH_WRITE_DELAY } from '../config/constants';

// ================================================
// SAVE MARKS ENTRY SUMMARY
// ================================================
export const saveMarksEntry = async (entryData) => {
  try {
    const entryId = `${entryData.batchId}_${entryData.traineeId}_${entryData.half}`;
    await setDoc(doc(db, 'marksEntry', entryId), {
      ...entryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: entryId, error: null };
  } catch (error) {
    console.error('saveMarksEntry error:', error);
    return { id: null, error: error.message };
  }
};

// ================================================
// SAVE DISTRIBUTED MARKS (4-level distribution)
// ================================================
export const saveDistributedMarks = async (distributedData, onProgress) => {
  try {
    const allRecords = [];

    console.log('saveDistributedMarks called with', distributedData.length, 'trainees');

    for (const trainee of distributedData) {
      // Support both direct loDistribution and nested tpDistribution
      const loDistribution =
        trainee.loDistribution ||
        trainee.tpDistribution?.loDistribution ||
        [];

      console.log(
        `Trainee ${trainee.traineeId}: loDistribution has ${loDistribution.length} LOs`
      );

      if (!loDistribution || loDistribution.length === 0) {
        console.warn('No loDistribution for trainee:', trainee.traineeId);
        continue;
      }

      for (const lo of loDistribution) {
        const practicals = lo.practicalDistribution || lo.practicals || [];

        console.log(`  LO ${lo.loNumber}: ${practicals.length} practicals`);

        for (const practical of practicals) {
          const recordId =
            `${trainee.batchId}_${trainee.traineeId}_${trainee.half}_P${practical.practicalNumber || practical.practicalId}`;

          allRecords.push({
            instructorId: trainee.instructorId || '',
            batchId: trainee.batchId || '',
            traineeId: trainee.traineeId || '',
            traineeName: trainee.traineeName || '',
            tradeId: trainee.tradeId || '',
            half: trainee.half || '',
            loId: lo.loId || '',
            loName: lo.loName || '',
            loNumber: lo.loNumber || 0,
            loMark: lo.loMark || 0,
            practicalId: practical.practicalId || '',
            practicalName: practical.practicalName || '',
            practicalNumber: practical.practicalNumber || 0,
            practicalMark: practical.practicalMark || 0,
            criteriaMarks: practical.criteriaMarks || [],
            entryType: trainee.entryType || '',
            totalMarks: trainee.totalMarks || 0,
            tpMarks70: trainee.tpMarks70 ?? null,
            esMarks: trainee.esMarks ?? null,
            edMarks: trainee.edMarks ?? null,
            wcsMarks: trainee.wcsMarks ?? null,
            _recordId: recordId,
          });
        }
      }
    }

    console.log(`Total distributed mark records to save: ${allRecords.length}`);

    if (allRecords.length === 0) {
      console.error('NO RECORDS TO SAVE — distributedMarks will be empty!');
      console.log('Full distributedData:', JSON.stringify(distributedData[0], null, 2));
      return { saved: 0, error: 'No distributed marks data generated' };
    }

    const total = allRecords.length;
    let saved = 0;

    // Save in batches of 25
    for (let i = 0; i < allRecords.length; i += BATCH_WRITE_SIZE) {
      const chunk = allRecords.slice(i, i + BATCH_WRITE_SIZE);
      const batchWrite = writeBatch(db);

      for (const record of chunk) {
        const ref = doc(db, 'distributedMarks', record._recordId);
        const { _recordId, ...cleanRecord } = record;
        batchWrite.set(ref, {
          ...cleanRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batchWrite.commit();
      saved += chunk.length;

      if (onProgress) {
        onProgress(Math.round((saved / total) * 100));
      }

      console.log(`Saved batch: ${saved}/${total}`);

      // Delay between batches
      if (i + BATCH_WRITE_SIZE < allRecords.length) {
        await delay(BATCH_WRITE_DELAY);
      }
    }

    console.log(`✅ distributedMarks saved successfully: ${saved} records`);
    return { saved, error: null };

  } catch (error) {
    console.error('saveDistributedMarks FAILED:', error);
    return { saved: 0, error: error.message };
  }
};

// ================================================
// SAVE ES MARKS
// ================================================
export const saveESMarks = async (esData) => {
  try {
    const batchWrite = writeBatch(db);

    for (const entry of esData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'esMarks', docId);
      batchWrite.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batchWrite.commit();
    console.log(`✅ esMarks saved: ${esData.length} records`);
    return { error: null };
  } catch (error) {
    console.error('saveESMarks error:', error);
    return { error: error.message };
  }
};

// ================================================
// SAVE ED MARKS
// ================================================
export const saveEDMarks = async (edData) => {
  try {
    const batchWrite = writeBatch(db);

    for (const entry of edData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'edMarks', docId);
      batchWrite.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batchWrite.commit();
    console.log(`✅ edMarks saved: ${edData.length} records`);
    return { error: null };
  } catch (error) {
    console.error('saveEDMarks error:', error);
    return { error: error.message };
  }
};

// ================================================
// SAVE WCS MARKS
// ================================================
export const saveWCSMarks = async (wcsData) => {
  try {
    const batchWrite = writeBatch(db);

    for (const entry of wcsData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'wcsMarks', docId);
      batchWrite.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batchWrite.commit();
    console.log(`✅ wcsMarks saved: ${wcsData.length} records`);
    return { error: null };
  } catch (error) {
    console.error('saveWCSMarks error:', error);
    return { error: error.message };
  }
};

// ================================================
// GET MARKS FOR BATCH AND HALF
// ================================================
export const getMarksForBatchHalf = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'marksEntry'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    console.error('getMarksForBatchHalf error:', error);
    return { marks: [], error: error.message };
  }
};

// ================================================
// GET DISTRIBUTED MARKS FOR BATCH AND HALF
// ================================================
export const getDistributedMarks = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'distributedMarks'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    console.error('getDistributedMarks error:', error);
    return { marks: [], error: error.message };
  }
};

// ================================================
// CHECK IF MARKS ALREADY EXIST
// ================================================
export const checkMarksExist = async (batchId, traineeId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'marksEntry'));
    const exists = snapshot.docs
      .map(d => d.data())
      .some(m =>
        m.batchId === batchId &&
        m.traineeId === traineeId &&
        m.half === half
      );
    return { exists, error: null };
  } catch (error) {
    console.error('checkMarksExist error:', error);
    return { exists: false, error: error.message };
  }
};
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { delay } from '../lib/utils';
import { BATCH_WRITE_SIZE, BATCH_WRITE_DELAY } from '../config/constants';

// Save marks entry (summary)
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

// Save distributed marks in batches
export const saveDistributedMarks = async (
  distributedData,
  onProgress
) => {
  try {
    const allRecords = [];

    // Flatten all records
    for (const trainee of distributedData) {
      const tpDist = trainee.tpDistribution;
      if (!tpDist?.loDistribution) continue;

      for (const lo of tpDist.loDistribution) {
        for (const practical of lo.practicalDistribution || []) {
          allRecords.push({
            instructorId: trainee.instructorId,
            batchId: trainee.batchId,
            traineeId: trainee.traineeId,
            traineeName: trainee.traineeName,
            tradeId: trainee.tradeId,
            half: trainee.half,
            loId: lo.loId,
            loName: lo.loName,
            loNumber: lo.loNumber,
            loMark: lo.loMark,
            practicalId: practical.practicalId,
            practicalName: practical.practicalName,
            practicalNumber: practical.practicalNumber,
            practicalMark: practical.practicalMark,
            criteriaMarks: practical.criteriaMarks,
            entryType: trainee.entryType,
            totalMarks: trainee.totalMarks,
            tpMarks70: trainee.tpMarks70,
            esMarks: trainee.esMarks,
            edMarks: trainee.edMarks,
            wcsMarks: trainee.wcsMarks,
          });
        }
      }
    }

    const total = allRecords.length;
    let saved = 0;

    // Save in batches of 25
    for (let i = 0; i < allRecords.length; i += BATCH_WRITE_SIZE) {
      const chunk = allRecords.slice(i, i + BATCH_WRITE_SIZE);
      const batch = writeBatch(db);

      for (const record of chunk) {
        const recordId = `${record.batchId}_${record.traineeId}_${record.half}_${record.practicalId}`;
        const ref = doc(db, 'distributedMarks', recordId);
        batch.set(ref, {
          ...record,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      saved += chunk.length;

      // Report progress
      if (onProgress) {
        onProgress(Math.round((saved / total) * 100));
      }

      // Delay between batches
      if (i + BATCH_WRITE_SIZE < allRecords.length) {
        await delay(BATCH_WRITE_DELAY);
      }
    }

    return { saved, error: null };
  } catch (error) {
    console.error('saveDistributedMarks error:', error);
    return { saved: 0, error: error.message };
  }
};

// Save ES marks
export const saveESMarks = async (esData) => {
  try {
    const batch = writeBatch(db);

    for (const entry of esData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'esMarks', docId);
      batch.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { error: null };
  } catch (error) {
    console.error('saveESMarks error:', error);
    return { error: error.message };
  }
};

// Save ED marks
export const saveEDMarks = async (edData) => {
  try {
    const batch = writeBatch(db);

    for (const entry of edData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'edMarks', docId);
      batch.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { error: null };
  } catch (error) {
    console.error('saveEDMarks error:', error);
    return { error: error.message };
  }
};

// Save WCS marks
export const saveWCSMarks = async (wcsData) => {
  try {
    const batch = writeBatch(db);

    for (const entry of wcsData) {
      const docId = `${entry.batchId}_${entry.traineeId}_${entry.half}`;
      const ref = doc(db, 'wcsMarks', docId);
      batch.set(ref, {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { error: null };
  } catch (error) {
    console.error('saveWCSMarks error:', error);
    return { error: error.message };
  }
};

// Get marks for a batch and half
export const getMarksForBatchHalf = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'marksEntry'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    return { marks: [], error: error.message };
  }
};

// Get distributed marks for a batch and half
export const getDistributedMarks = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'distributedMarks'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    return { marks: [], error: error.message };
  }
};

// Check if marks already saved for a trainee
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
    return { exists: false, error: error.message };
  }
};
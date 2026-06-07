import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all trainees for a batch
export const getBatchTrainees = async (batchId) => {
  try {
    if (!batchId) return { trainees: [], error: 'No batch ID' };
    const snapshot = await getDocs(collection(db, 'trainees'));
    const trainees = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.batchId === batchId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { trainees, error: null };
  } catch (error) {
    console.error('getBatchTrainees error:', error);
    return { trainees: [], error: error.message };
  }
};

// Get trainee count for a batch
export const getTraineeCount = async (batchId) => {
  try {
    if (!batchId) return { count: 0, error: 'No batch ID' };
    const snapshot = await getDocs(collection(db, 'trainees'));
    const count = snapshot.docs
      .map(d => d.data())
      .filter(t => t.batchId === batchId).length;
    return { count, error: null };
  } catch (error) {
    console.error('getTraineeCount error:', error);
    return { count: 0, error: error.message };
  }
};

// Add single trainee
export const addTrainee = async (traineeData) => {
  try {
    const ref = await addDoc(collection(db, 'trainees'), {
      batchId: traineeData.batchId || '',
      instructorId: traineeData.instructorId || '',
      tradeId: traineeData.tradeId || '',
      enrollmentNumber: traineeData.enrollmentNumber || '',
      name: traineeData.name || '',
      fatherName: traineeData.fatherName || '',
      dateOfBirth: traineeData.dateOfBirth || '',
      order: traineeData.order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    console.error('addTrainee error:', error);
    return { id: null, error: error.message };
  }
};

// Bulk add trainees (max 25 per batch)
export const bulkAddTrainees = async (trainees) => {
  try {
    const results = [];
    // Process in chunks of 25
    for (let i = 0; i < trainees.length; i += 25) {
      const chunk = trainees.slice(i, i + 25);
      const batch = writeBatch(db);
      const chunkRefs = [];

      for (const trainee of chunk) {
        const ref = doc(collection(db, 'trainees'));
        batch.set(ref, {
          batchId: trainee.batchId || '',
          instructorId: trainee.instructorId || '',
          tradeId: trainee.tradeId || '',
          enrollmentNumber: trainee.enrollmentNumber || '',
          name: trainee.name || '',
          fatherName: trainee.fatherName || '',
          dateOfBirth: trainee.dateOfBirth || '',
          order: trainee.order || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        chunkRefs.push(ref.id);
      }

      await batch.commit();
      results.push(...chunkRefs);

      // 150ms delay between batches
      if (i + 25 < trainees.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    return { ids: results, error: null };
  } catch (error) {
    console.error('bulkAddTrainees error:', error);
    return { ids: [], error: error.message };
  }
};

// Update trainee
export const updateTrainee = async (traineeId, traineeData) => {
  try {
    await updateDoc(doc(db, 'trainees', traineeId), {
      ...traineeData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updateTrainee error:', error);
    return { error: error.message };
  }
};

// Delete trainee
export const deleteTrainee = async (traineeId) => {
  try {
    await deleteDoc(doc(db, 'trainees', traineeId));
    return { error: null };
  } catch (error) {
    console.error('deleteTrainee error:', error);
    return { error: error.message };
  }
};
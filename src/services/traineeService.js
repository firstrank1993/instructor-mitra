import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all trainees for a batch
export const getBatchTrainees = async (batchId) => {
  try {
    const q = query(
      collection(db, 'trainees'),
      where('batchId', '==', batchId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    const trainees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { trainees, error: null };
  } catch (error) {
    return { trainees: [], error: error.message };
  }
};

// Add single trainee
export const addTrainee = async (traineeData) => {
  try {
    const ref = await addDoc(collection(db, 'trainees'), {
      ...traineeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Bulk add trainees
export const bulkAddTrainees = async (trainees) => {
  try {
    const batch = writeBatch(db);
    const refs = [];

    for (const trainee of trainees) {
      const ref = doc(collection(db, 'trainees'));
      batch.set(ref, {
        ...trainee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      refs.push(ref.id);
    }

    await batch.commit();
    return { ids: refs, error: null };
  } catch (error) {
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
    return { error: error.message };
  }
};

// Delete trainee
export const deleteTrainee = async (traineeId) => {
  try {
    await deleteDoc(doc(db, 'trainees', traineeId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get trainee count for batch
export const getTraineeCount = async (batchId) => {
  try {
    const q = query(
      collection(db, 'trainees'),
      where('batchId', '==', batchId)
    );
    const snapshot = await getDocs(q);
    return { count: snapshot.size, error: null };
  } catch (error) {
    return { count: 0, error: error.message };
  }
};
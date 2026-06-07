import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all batches for an instructor
export const getInstructorBatches = async (instructorId) => {
  try {
    const q = query(
      collection(db, 'batches'),
      where('instructorId', '==', instructorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const batches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { batches, error: null };
  } catch (error) {
    return { batches: [], error: error.message };
  }
};

// Get active batch for instructor
export const getActiveBatch = async (instructorId) => {
  try {
    const q = query(
      collection(db, 'batches'),
      where('instructorId', '==', instructorId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { batch: { id: doc.id, ...doc.data() }, error: null };
    }
    return { batch: null, error: null };
  } catch (error) {
    return { batch: null, error: error.message };
  }
};

// Create new batch
export const createBatch = async (batchData) => {
  try {
    const ref = await addDoc(collection(db, 'batches'), {
      ...batchData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Set batch as active (deactivate others first)
export const setActiveBatch = async (instructorId, batchId) => {
  try {
    // Deactivate all batches for this instructor
    const q = query(
      collection(db, 'batches'),
      where('instructorId', '==', instructorId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    for (const batchDoc of snapshot.docs) {
      await updateDoc(doc(db, 'batches', batchDoc.id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    }

    // Set new active batch
    await updateDoc(doc(db, 'batches', batchId), {
      isActive: true,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Update batch
export const updateBatch = async (batchId, batchData) => {
  try {
    await updateDoc(doc(db, 'batches', batchId), {
      ...batchData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Delete batch
export const deleteBatch = async (batchId) => {
  try {
    await deleteDoc(doc(db, 'batches', batchId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
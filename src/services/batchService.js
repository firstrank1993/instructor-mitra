import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all batches for an instructor
export const getInstructorBatches = async (instructorId) => {
  try {
    if (!instructorId) return { batches: [], error: 'No instructor ID' };
    const snapshot = await getDocs(collection(db, 'batches'));
    const batches = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.instructorId === instructorId)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    return { batches, error: null };
  } catch (error) {
    console.error('getInstructorBatches error:', error);
    return { batches: [], error: error.message };
  }
};

// Get active batch for instructor
export const getActiveBatch = async (instructorId) => {
  try {
    if (!instructorId) return { batch: null, error: 'No instructor ID' };
    const snapshot = await getDocs(collection(db, 'batches'));
    const batch = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .find(b => b.instructorId === instructorId && b.isActive === true);
    return { batch: batch || null, error: null };
  } catch (error) {
    console.error('getActiveBatch error:', error);
    return { batch: null, error: error.message };
  }
};

// Get single batch by ID
export const getBatchById = async (batchId) => {
  try {
    if (!batchId) return { batch: null, error: 'No batch ID' };
    const batchDoc = await getDoc(doc(db, 'batches', batchId));
    if (batchDoc.exists()) {
      return { batch: { id: batchDoc.id, ...batchDoc.data() }, error: null };
    }
    return { batch: null, error: 'Batch not found' };
  } catch (error) {
    console.error('getBatchById error:', error);
    return { batch: null, error: error.message };
  }
};

// Create new batch
export const createBatch = async (batchData) => {
  try {
    const ref = await addDoc(collection(db, 'batches'), {
      instructorId: batchData.instructorId || '',
      tradeId: batchData.tradeId || '',
      tradeName: batchData.tradeName || '',
      batchNumber: batchData.batchNumber || '',
      yearOfAssessment: batchData.yearOfAssessment || '',
      isActive: batchData.isActive || false,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    console.error('createBatch error:', error);
    return { id: null, error: error.message };
  }
};

// Set batch as active
// Deactivates all other batches for this instructor first
export const setActiveBatch = async (instructorId, batchId) => {
  try {
    if (!instructorId || !batchId) {
      return { error: 'Missing instructor ID or batch ID' };
    }

    // Get all batches for this instructor
    const snapshot = await getDocs(collection(db, 'batches'));
    const instructorBatches = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.instructorId === instructorId);

    // Deactivate all
    for (const batch of instructorBatches) {
      if (batch.isActive === true) {
        await updateDoc(doc(db, 'batches', batch.id), {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Activate selected batch
    await updateDoc(doc(db, 'batches', batchId), {
      isActive: true,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    console.error('setActiveBatch error:', error);
    return { error: error.message };
  }
};

// Update batch details
export const updateBatch = async (batchId, batchData) => {
  try {
    await updateDoc(doc(db, 'batches', batchId), {
      ...batchData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updateBatch error:', error);
    return { error: error.message };
  }
};

// Archive batch
export const archiveBatch = async (batchId) => {
  try {
    await updateDoc(doc(db, 'batches', batchId), {
      isActive: false,
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('archiveBatch error:', error);
    return { error: error.message };
  }
};

// Delete batch
export const deleteBatch = async (batchId) => {
  try {
    const { getDocs, collection, query, where, writeBatch } = await import('firebase/firestore');

    // Collections to clean up
    const collectionsToClean = [
      'trainees',
      'marksEntry',
      'distributedMarks',
      'esMarks',
      'edMarks',
      'wcsMarks',
    ];

    // Delete all related documents
    for (const collectionName of collectionsToClean) {
      const q = query(
        collection(db, collectionName),
        where('batchId', '==', batchId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) continue;

      // Delete in batches of 25
      const chunks = [];
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 25) {
        chunks.push(docs.slice(i, i + 25));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      console.log(`Deleted ${snapshot.size} docs from ${collectionName}`);
    }

    // Finally delete the batch itself
    await deleteDoc(doc(db, 'batches', batchId));
    console.log(`✅ Batch ${batchId} and all related data deleted`);
    return { error: null };
  } catch (error) {
    console.error('deleteBatch error:', error);
    return { error: error.message };
  }
};
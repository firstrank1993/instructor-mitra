import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all criteria
export const getAllCriteria = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'assessmentCriteria'));
    const criteria = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { criteria, error: null };
  } catch (error) {
    console.error('getAllCriteria error:', error);
    return { criteria: [], error: error.message };
  }
};

// Update criteria
export const updateCriteria = async (criteriaId, criteriaData) => {
  try {
    await updateDoc(doc(db, 'assessmentCriteria', criteriaId), {
      ...criteriaData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updateCriteria error:', error);
    return { error: error.message };
  }
};
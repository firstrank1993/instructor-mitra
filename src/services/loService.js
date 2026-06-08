import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all LOs for a trade and half
export const getLOsByTradeAndHalf = async (tradeId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'learningOutcomes'));
    const los = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(lo => lo.tradeId === tradeId && lo.half === half)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { los, error: null };
  } catch (error) {
    console.error('getLOsByTradeAndHalf error:', error);
    return { los: [], error: error.message };
  }
};

// Get all LOs for a trade (all halves)
export const getLOsByTrade = async (tradeId) => {
  try {
    const snapshot = await getDocs(collection(db, 'learningOutcomes'));
    const los = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(lo => lo.tradeId === tradeId)
      .sort((a, b) => {
        if (a.half < b.half) return -1;
        if (a.half > b.half) return 1;
        return (a.order || 0) - (b.order || 0);
      });
    return { los, error: null };
  } catch (error) {
    console.error('getLOsByTrade error:', error);
    return { los: [], error: error.message };
  }
};

// Add LO
export const addLO = async (loData) => {
  try {
    const ref = await addDoc(collection(db, 'learningOutcomes'), {
      tradeId: loData.tradeId || '',
      tradeName: loData.tradeName || '',
      half: loData.half || 'H1',
      loNumber: loData.loNumber || 1,
      loName: loData.loName || '',
      order: loData.order || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    console.error('addLO error:', error);
    return { id: null, error: error.message };
  }
};

// Update LO
export const updateLO = async (loId, loData) => {
  try {
    await updateDoc(doc(db, 'learningOutcomes', loId), {
      ...loData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updateLO error:', error);
    return { error: error.message };
  }
};

// Delete LO
export const deleteLO = async (loId) => {
  try {
    await deleteDoc(doc(db, 'learningOutcomes', loId));
    return { error: null };
  } catch (error) {
    console.error('deleteLO error:', error);
    return { error: error.message };
  }
};
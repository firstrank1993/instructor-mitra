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

// Get all practicals for an LO
export const getPracticalsByLO = async (loId) => {
  try {
    const snapshot = await getDocs(collection(db, 'practicals'));
    const practicals = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.loId === loId)
      .sort((a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0));
    return { practicals, error: null };
  } catch (error) {
    console.error('getPracticalsByLO error:', error);
    return { practicals: [], error: error.message };
  }
};

// Get all practicals for a trade and half
export const getPracticalsByTradeAndHalf = async (tradeId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'practicals'));
    const practicals = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.tradeId === tradeId && p.half === half)
      .sort((a, b) => (a.practicalNumber || 0) - (b.practicalNumber || 0));
    return { practicals, error: null };
  } catch (error) {
    console.error('getPracticalsByTradeAndHalf error:', error);
    return { practicals: [], error: error.message };
  }
};

// Add practical
export const addPractical = async (practicalData) => {
  try {
    const ref = await addDoc(collection(db, 'practicals'), {
      tradeId: practicalData.tradeId || '',
      loId: practicalData.loId || '',
      loName: practicalData.loName || '',
      half: practicalData.half || 'H1',
      practicalNumber: practicalData.practicalNumber || 1,
      practicalName: practicalData.practicalName || '',
      order: practicalData.order || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    console.error('addPractical error:', error);
    return { id: null, error: error.message };
  }
};

// Update practical
export const updatePractical = async (practicalId, practicalData) => {
  try {
    await updateDoc(doc(db, 'practicals', practicalId), {
      ...practicalData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updatePractical error:', error);
    return { error: error.message };
  }
};

// Delete practical
export const deletePractical = async (practicalId) => {
  try {
    await deleteDoc(doc(db, 'practicals', practicalId));
    return { error: null };
  } catch (error) {
    console.error('deletePractical error:', error);
    return { error: error.message };
  }
};
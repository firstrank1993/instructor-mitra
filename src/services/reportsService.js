import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get distributed marks for batch and half
export const getDistributedMarksForReport = async (batchId, half) => {
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

// Get ES marks for batch and half
export const getESMarksForReport = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'esMarks'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    return { marks: [], error: error.message };
  }
};

// Get ED marks for batch and half
export const getEDMarksForReport = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'edMarks'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    return { marks: [], error: error.message };
  }
};

// Get WCS marks for batch and half
export const getWCSMarksForReport = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'wcsMarks'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    return { marks: [], error: error.message };
  }
};
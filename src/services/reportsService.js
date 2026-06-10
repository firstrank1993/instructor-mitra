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
    console.error('getDistributedMarksForReport error:', error);
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
    console.error('getESMarksForReport error:', error);
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
    console.error('getEDMarksForReport error:', error);
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
    console.error('getWCSMarksForReport error:', error);
    return { marks: [], error: error.message };
  }
};

// Get marks entry summary for batch and half
export const getMarksEntrySummary = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'marksEntry'));
    const marks = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.batchId === batchId && m.half === half);
    return { marks, error: null };
  } catch (error) {
    console.error('getMarksEntrySummary error:', error);
    return { marks: [], error: error.message };
  }
};
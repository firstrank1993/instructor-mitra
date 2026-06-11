import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get ALL distributed marks for a batch (any half)
export const getDistributedMarksForReport = async (batchId, half) => {
  try {
    const snapshot = await getDocs(collection(db, 'distributedMarks'));
    const allMarks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Total distributedMarks in DB: ${allMarks.length}`);
    console.log(`Filtering for batchId: ${batchId}, half: ${half}`);

    const filtered = allMarks.filter(m => {
      const batchMatch = m.batchId === batchId;
      const halfMatch = m.half === half;
      return batchMatch && halfMatch;
    });

    console.log(`Found ${filtered.length} marks for this batch+half`);

    // Debug: show unique batchIds in DB
    const uniqueBatches = [...new Set(allMarks.map(m => m.batchId))];
    console.log('Unique batchIds in distributedMarks:', uniqueBatches);

    const uniqueHalves = [...new Set(allMarks.map(m => m.half))];
    console.log('Unique halves in distributedMarks:', uniqueHalves);

    return { marks: filtered, error: null };
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
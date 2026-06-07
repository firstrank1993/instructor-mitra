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

// Get all trades
export const getAllTrades = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'trades'));
    const trades = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(trade => trade.isActive !== false)
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
    return { trades, error: null };
  } catch (error) {
    console.error('getAllTrades error:', error);
    return { trades: [], error: error.message };
  }
};

// Get all trades including inactive (for admin)
export const getAllTradesAdmin = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'trades'));
    const trades = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
    return { trades, error: null };
  } catch (error) {
    console.error('getAllTradesAdmin error:', error);
    return { trades: [], error: error.message };
  }
};

// Get single trade by ID
export const getTradeById = async (tradeId) => {
  try {
    if (!tradeId) return { trade: null, error: 'No trade ID provided' };
    const tradeDoc = await getDoc(doc(db, 'trades', tradeId));
    if (tradeDoc.exists()) {
      return { trade: { id: tradeDoc.id, ...tradeDoc.data() }, error: null };
    }
    return { trade: null, error: 'Trade not found' };
  } catch (error) {
    console.error('getTradeById error:', error);
    return { trade: null, error: error.message };
  }
};

// Add new trade
export const addTrade = async (tradeData) => {
  try {
    const ref = await addDoc(collection(db, 'trades'), {
      name: tradeData.name || '',
      duration: tradeData.duration || 1,
      subjects: tradeData.subjects || ['TP', 'TT', 'ES'],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    console.error('addTrade error:', error);
    return { id: null, error: error.message };
  }
};

// Update trade
export const updateTrade = async (tradeId, tradeData) => {
  try {
    await updateDoc(doc(db, 'trades', tradeId), {
      ...tradeData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('updateTrade error:', error);
    return { error: error.message };
  }
};

// Delete trade (soft delete)
export const deleteTrade = async (tradeId) => {
  try {
    await updateDoc(doc(db, 'trades', tradeId), {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('deleteTrade error:', error);
    return { error: error.message };
  }
};

// Hard delete trade
export const hardDeleteTrade = async (tradeId) => {
  try {
    await deleteDoc(doc(db, 'trades', tradeId));
    return { error: null };
  } catch (error) {
    console.error('hardDeleteTrade error:', error);
    return { error: error.message };
  }
};
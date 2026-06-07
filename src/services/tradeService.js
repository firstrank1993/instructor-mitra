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

// Get all active trades
export const getAllTrades = async () => {
  try {
    const q = query(
      collection(db, 'trades'),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    const trades = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { trades, error: null };
  } catch (error) {
    return { trades: [], error: error.message };
  }
};

// Get single trade
export const getTradeById = async (tradeId) => {
  try {
    const tradeDoc = await getDoc(doc(db, 'trades', tradeId));
    if (tradeDoc.exists()) {
      return { trade: { id: tradeDoc.id, ...tradeDoc.data() }, error: null };
    }
    return { trade: null, error: 'Trade not found' };
  } catch (error) {
    return { trade: null, error: error.message };
  }
};

// Add new trade (admin only)
export const addTrade = async (tradeData) => {
  try {
    const ref = await addDoc(collection(db, 'trades'), {
      ...tradeData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Update trade (admin only)
export const updateTrade = async (tradeId, tradeData) => {
  try {
    await updateDoc(doc(db, 'trades', tradeId), {
      ...tradeData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Delete trade (admin only)
export const deleteTrade = async (tradeId) => {
  try {
    await deleteDoc(doc(db, 'trades', tradeId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
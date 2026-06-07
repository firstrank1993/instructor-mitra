import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all users
export const getAllUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { users, error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

// Get pending users
export const getPendingUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { users, error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

// Get recent users
export const getRecentUsers = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'instructor'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { users, error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

// Get single user
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { user: { id: userDoc.id, ...userDoc.data() }, error: null };
    }
    return { user: null, error: 'User not found' };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Approve user
export const approveUser = async (userId, expiryDate = null) => {
  try {
    const updateData = {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (expiryDate) {
      updateData.expiryDate = expiryDate;
    }
    await updateDoc(doc(db, 'users', userId), updateData);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Block user
export const blockUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'blocked',
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Update user expiry date
export const updateUserExpiry = async (userId, expiryDate) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      expiryDate,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get user counts
export const getUserCounts = async () => {
  try {
    const allSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'instructor'))
    );
    const pendingSnapshot = await getDocs(
      query(collection(db, 'users'), where('status', '==', 'pending'))
    );
    const approvedSnapshot = await getDocs(
      query(collection(db, 'users'), where('status', '==', 'approved'))
    );
    const blockedSnapshot = await getDocs(
      query(collection(db, 'users'), where('status', '==', 'blocked'))
    );

    return {
      counts: {
        total: allSnapshot.size,
        pending: pendingSnapshot.size,
        approved: approvedSnapshot.size,
        blocked: blockedSnapshot.size,
      },
      error: null
    };
  } catch (error) {
    return { counts: null, error: error.message };
  }
};
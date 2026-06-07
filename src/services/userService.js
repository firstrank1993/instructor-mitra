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
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    return { users, error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

// Get pending users
export const getPendingUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.status === 'pending')
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    return { users, error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

// Get recent users
export const getRecentUsers = async (limitCount = 5) => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.role === 'instructor')
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      })
      .slice(0, limitCount);
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

// Update user expiry
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
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => doc.data());
    const instructors = users.filter(u => u.role === 'instructor');

    return {
      counts: {
        total: instructors.length,
        pending: instructors.filter(u => u.status === 'pending').length,
        approved: instructors.filter(u => u.status === 'approved').length,
        blocked: instructors.filter(u => u.status === 'blocked').length,
      },
      error: null
    };
  } catch (error) {
    return { counts: null, error: error.message };
  }
};
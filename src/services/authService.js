import { 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { ADMIN_EMAIL, USER_ROLES, USER_STATUS } from '../config/constants';

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { userData: userDoc.data(), error: null };
    }
    return { userData: null, error: null };
  } catch (error) {
    return { userData: null, error: error.message };
  }
};

// Create new user in Firestore
export const createUserProfile = async (user, additionalData) => {
  try {
    const isAdmin = user.email === ADMIN_EMAIL;
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: isAdmin ? USER_ROLES.ADMIN : USER_ROLES.INSTRUCTOR,
      status: isAdmin ? USER_STATUS.APPROVED : USER_STATUS.PENDING,
      itiName: additionalData?.itiName || '',
      address: additionalData?.address || '',
      tradeId: additionalData?.tradeId || '',
      tradeName: additionalData?.tradeName || '',
      approvedAt: isAdmin ? serverTimestamp() : null,
      expiryDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    return { userData, error: null };
  } catch (error) {
    return { userData: null, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user access is expired
export const isUserExpired = (userData) => {
  if (!userData?.expiryDate) return false;
  const expiry = userData.expiryDate?.toDate?.() || new Date(userData.expiryDate);
  return new Date() > expiry;
};
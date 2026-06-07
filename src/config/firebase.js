import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBIaYbJgBEXv3SFhl4QuXRWJJrugNsFMb4",
  authDomain: "instructor-mitra.firebaseapp.com",
  projectId: "instructor-mitra",
  storageBucket: "instructor-mitra.firebasestorage.app",
  messagingSenderId: "373819129699",
  appId: "1:373819129699:web:d47e73b47e25354f309d56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
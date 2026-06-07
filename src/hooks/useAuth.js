import { useEffect } from 'react';
import { onAuthStateChange, getUserData, createUserProfile } from '../services/authService';
import useAuthStore from '../store/authStore';
import { ADMIN_EMAIL, USER_ROLES, USER_STATUS } from '../config/constants';

const useAuth = () => {
  const { 
    user, 
    userData, 
    loading, 
    isAdmin, 
    isApproved,
    setUser, 
    setUserData, 
    setLoading, 
    clearUser 
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get user data from Firestore
        const { userData: firestoreData } = await getUserData(firebaseUser.uid);
        
        if (firestoreData) {
          // Existing user
          setUserData(firestoreData);
        } else {
          // New user - check if admin
          if (firebaseUser.email === ADMIN_EMAIL) {
            const { userData: newData } = await createUserProfile(firebaseUser, {});
            setUserData(newData);
          }
          // For new non-admin users, userData remains null
          // They will be redirected to registration
          setUserData(null);
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    userData, 
    loading, 
    isAdmin, 
    isApproved 
  };
};

export default useAuth;
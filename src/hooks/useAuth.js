import { useEffect } from 'react';
import { onAuthStateChange, getUserData, createUserProfile } from '../services/authService';
import { getActiveBatch } from '../services/batchService';
import { getTraineeCount } from '../services/traineeService';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { ADMIN_EMAIL } from '../config/constants';

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

  const { setActiveBatch, setTraineeCount } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const { userData: firestoreData } = await getUserData(firebaseUser.uid);

        if (firestoreData) {
          setUserData(firestoreData);

          // Auto-load active batch when user logs in
          if (firestoreData.role === 'instructor' && firestoreData.status === 'approved') {
            try {
              const { batch } = await getActiveBatch(firebaseUser.uid);
              if (batch) {
                setActiveBatch(batch);
                const { count } = await getTraineeCount(batch.id);
                setTraineeCount(count);
              }
            } catch (err) {
              console.error('Error loading active batch:', err);
            }
          }
        } else {
          if (firebaseUser.email === ADMIN_EMAIL) {
            const { userData: newData } = await createUserProfile(firebaseUser, {});
            setUserData(newData);
          } else {
            setUserData(null);
          }
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading, isAdmin, isApproved };
};

export default useAuth;
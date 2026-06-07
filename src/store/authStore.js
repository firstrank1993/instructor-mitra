import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // State
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isApproved: false,

  // Actions
  setUser: (user) => set({ user }),
  
  setUserData: (userData) => set({ 
    userData,
    isAdmin: userData?.role === 'admin',
    isApproved: userData?.status === 'approved',
  }),
  
  setLoading: (loading) => set({ loading }),
  
  clearUser: () => set({ 
    user: null, 
    userData: null, 
    isAdmin: false,
    isApproved: false,
    loading: false,
  }),
}));

export default useAuthStore;
import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Active batch
  activeBatch: null,
  setActiveBatch: (batch) => set({ activeBatch: batch }),

  // Trainee count
  traineeCount: 0,
  setTraineeCount: (count) => set({ traineeCount: count }),

  // Loading states
  batchLoading: false,
  setBatchLoading: (loading) => set({ batchLoading: loading }),

  // Selected half
  selectedHalf: 'H1',
  setSelectedHalf: (half) => set({ selectedHalf: half }),

  // Clear all
  clearApp: () => set({
    activeBatch: null,
    traineeCount: 0,
    selectedHalf: 'H1',
  }),
}));

export default useAppStore;
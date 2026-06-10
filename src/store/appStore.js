import { create } from 'zustand';

const useAppStore = create((set) => ({
  activeBatch: null,
  setActiveBatch: (batch) => set({ activeBatch: batch }),

  traineeCount: 0,
  setTraineeCount: (count) => set({ traineeCount: count }),

  batchLoading: false,
  setBatchLoading: (loading) => set({ batchLoading: loading }),

  selectedHalf: 'H1',
  setSelectedHalf: (half) => set({ selectedHalf: half }),

  clearApp: () => set({
    activeBatch: null,
    traineeCount: 0,
    selectedHalf: 'H1',
  }),
}));

export default useAppStore;
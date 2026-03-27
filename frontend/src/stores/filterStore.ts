import { create } from 'zustand';

interface FilterState {
  region: string;
  jobType: string;
  sort: string;
  minPay: number | undefined;
  maxPay: number | undefined;
  page: number;
  setRegion: (region: string) => void;
  setJobType: (jobType: string) => void;
  setSort: (sort: string) => void;
  setPayRange: (min?: number, max?: number) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  region: '',
  jobType: '',
  sort: 'latest',
  minPay: undefined,
  maxPay: undefined,
  page: 1,
  setRegion: (region) => set({ region, page: 1 }),
  setJobType: (jobType) => set({ jobType, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPayRange: (minPay, maxPay) => set({ minPay, maxPay, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ region: '', jobType: '', sort: 'latest', minPay: undefined, maxPay: undefined, page: 1 }),
}));

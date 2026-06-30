import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OWNER' 
  | 'MANAGER' 
  | 'VETERINARIAN' 
  | 'SUPERVISOR' 
  | 'STORE_KEEPER' 
  | 'ACCOUNTANT' 
  | 'ATTENDANT';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  farmId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FarmProfile {
  farmId: string;
  name: string;
  capacity?: number;
  ownerUid: string;
  autoVaccinationSchedule?: boolean;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  activeFarm: FarmProfile | null;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setActiveFarm: (farm: FarmProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  activeFarm: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setActiveFarm: (activeFarm) => set({ activeFarm }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, activeFarm: null, isLoading: false })
}));

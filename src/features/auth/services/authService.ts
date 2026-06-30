import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { setGlobalDocument, getGlobalDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile, FarmProfile } from '@/store/authStore';
import { doc } from 'firebase/firestore';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  farmName: string;
  phone?: string;
}

export const authService = {
  async registerOwner(data: RegisterData): Promise<UserCredential> {
    // 1. Create Auth User
    const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCred.user.uid;

    // 2. Generate a Farm ID (using Firestore to generate an ID)
    const farmRef = doc(db, 'farms', uid); // Using UID as farmId for the owner's primary farm
    const farmId = farmRef.id;

    // 3. Create Farm Profile
    const farmProfile: FarmProfile = {
      farmId,
      name: data.farmName,
      ownerUid: uid,
    };
    await setGlobalDocument('farms', farmId, farmProfile);

    // 4. Create User Profile
    const userProfile: UserProfile = {
      uid,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      role: 'OWNER',
      farmId,
      status: 'ACTIVE',
    };
    await setGlobalDocument('users', uid, userProfile);

    // Fix race condition: manually update store since auth listener might have already run
    useAuthStore.getState().setProfile(userProfile);
    useAuthStore.getState().setActiveFarm(farmProfile);

    return userCred;
  },

  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    const uid = userCred.user.uid;

    // Check if user already has a profile
    const existingProfile = await getGlobalDocument<UserProfile>('users', uid);
    
    if (!existingProfile) {
      // First time Google login, create a Farm and Profile
      const farmRef = doc(db, 'farms', uid);
      const farmId = farmRef.id;

      const farmProfile: FarmProfile = {
        farmId,
        name: `${userCred.user.displayName || 'My'} Farm`,
        ownerUid: uid,
      };
      await setGlobalDocument('farms', farmId, farmProfile);

      const userProfile: UserProfile = {
        uid,
        fullName: userCred.user.displayName || 'Farmer',
        email: userCred.user.email || '',
        role: 'OWNER',
        farmId,
        status: 'ACTIVE',
      };
      await setGlobalDocument('users', uid, userProfile);
      
      // Fix race condition: manually update store since auth listener might have already run
      useAuthStore.getState().setProfile(userProfile);
      useAuthStore.getState().setActiveFarm(farmProfile);
    }

    return userCred;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }
};

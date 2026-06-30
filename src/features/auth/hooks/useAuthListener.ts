import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile, FarmProfile } from '@/store/authStore';
import { getGlobalDocument } from '@/lib/firestore';

// Safe document fetch that won't hang forever
async function safeGetDocument<T>(
  collection: string,
  id: string,
  timeoutMs = 8000
): Promise<T | null> {
  return Promise.race([
    getGlobalDocument<T>(collection, id),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export function useAuthListener() {
  const { setUser, setProfile, setActiveFarm, setLoading } = useAuthStore();

  useEffect(() => {
    // Hard failsafe: if nothing resolves in 12 seconds, unblock the UI
    const hardTimeout = setTimeout(() => {
      console.warn('[Auth] Hard timeout triggered — unblocking UI');
      setLoading(false);
    }, 12000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Fetch User Profile
          const profile = await safeGetDocument<UserProfile>('users', firebaseUser.uid);

          if (profile) {
            setProfile(profile);

            // Fetch Farm Profile
            if (profile.farmId) {
              const farm = await safeGetDocument<FarmProfile>('farms', profile.farmId);
              setActiveFarm(farm);
            } else {
              setActiveFarm(null);
            }
          } else {
            // New user without a profile yet (First run) OR rules blocked read
            setProfile(null);
            setActiveFarm(null);
          }
        } else {
          // Logged out
          setUser(null);
          setProfile(null);
          setActiveFarm(null);
        }
      } catch (error) {
        console.error('[Auth] Error in auth listener:', error);
      } finally {
        clearTimeout(hardTimeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(hardTimeout);
      unsubscribe();
    };
  }, [setUser, setProfile, setActiveFarm, setLoading]);
}

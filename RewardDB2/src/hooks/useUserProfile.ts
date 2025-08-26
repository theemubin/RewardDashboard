import { useEffect, useState, useMemo } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  campus?: string;
  house?: string;
  // other fields can be added later
}

export const useUserProfile = () => {
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Memoize profile to prevent unnecessary re-renders during form interactions
  const memoizedProfile = useMemo(() => profile, [
    profile?.uid,
    profile?.displayName,
    profile?.house,
    profile?.campus
  ]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setProfile({ uid: user.uid, ...(snap.data() as any) });
      } else {
        setProfile({ uid: user.uid });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { user, profile: memoizedProfile, loading: loading || authLoading };
};

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthState, logoutUser } from '../services/authService';
import { subscribeToUserProfile } from '../services/userService';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState((authUser) => {
      setUser(authUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (authUser) {
        unsubscribeProfile = subscribeToUserProfile(
          authUser.uid,
          (userProfile) => {
            setProfile(userProfile);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching profile:', err);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    logout: logoutUser,
  };
}

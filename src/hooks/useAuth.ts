import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, loginAdmin, loginAdminWithGoogle, logoutAdmin, syncAdminRecord } from '../lib/firestoreService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && currentUser.email?.toLowerCase() === 'mdarmanali0126@gmail.com') {
        syncAdminRecord(currentUser).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    return await loginAdmin(email, pass);
  };

  const loginWithGoogle = async () => {
    return await loginAdminWithGoogle();
  };

  const logout = async () => {
    return await logoutAdmin();
  };

  const isAuthorizedAdmin = user?.email?.toLowerCase() === 'mdarmanali0126@gmail.com';

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAuthorizedAdmin,
    login,
    loginWithGoogle,
    logout
  };
}

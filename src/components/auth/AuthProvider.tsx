"use client";
import {
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';

import { auth, db } from '@/lib/firebase/config';
import { AuthContext, UserProfile, UserRole } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const protectedRoutes: { [key in UserRole]: string[] } = {
  farmer: ['/farmer'],
  owner: ['/owner'],
  buyer: ['/buyer'],
};

const publicRoutes = ['/', '/login', '/signup'];

const roleRedirects: { [key in UserRole]: string } = {
  farmer: '/farmer',
  owner: '/owner',
  buyer: '/buyer/marketplace',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    if (user && !userProfile) {
      const docRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          // If user exists in auth but not in firestore, something is wrong.
          // Log them out to be safe.
          handleSignOut();
        }
        setLoading(false);
      });
    } else if (!user) {
        setUserProfile(null);
        setLoading(false);
    }
    return () => unsubscribeProfile && unsubscribeProfile();
  }, [user, userProfile, handleSignOut]);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.some(route => pathname === route);
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isPublic) {
      router.push('/login');
      return;
    }

    if (user && userProfile) {
      if (isAuthPage) {
        router.push(roleRedirects[userProfile.role]);
        return;
      }

      const allowedPaths = protectedRoutes[userProfile.role];
      const isAuthorized = allowedPaths.some(prefix => pathname.startsWith(prefix));

      if (!isAuthorized && !isPublic) {
         router.push(roleRedirects[userProfile.role]);
      }
    }
  }, [user, userProfile, loading, pathname, router]);

  if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

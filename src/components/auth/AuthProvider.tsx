
"use client";
import {
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Toaster } from '@/components/ui/toaster';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { AuthContext, UserProfile, UserRole } from '@/context/AuthContext';
import { useFirebase } from '@/firebase';

const protectedRoutes: { [key in UserRole | 'admin']: string[] } = {
  farmer: ['/farmer'],
  owner: ['/owner'],
  buyer: ['/buyer'],
  admin: ['/admin'],
};

const publicRoutes = ['/', '/login', '/signup'];

const roleRedirects: { [key in UserRole]: string } = {
  farmer: '/farmer/dashboard',
  owner: '/owner/dashboard',
  buyer: '/buyer/marketplace',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // State updates will be triggered by onAuthStateChanged
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  }, [auth, toast]);

  useEffect(() => {
    if (!auth) {
      // No auth instance; nothing to observe but we should end loading.
      // Defer to avoid synchronous setState in effect warning.
      queueMicrotask(() => setLoading(false));
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        // Defer state update to avoid synchronous setState inside effect warnings
        queueMicrotask(() => setLoading(false));
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);
  
  useEffect(() => {
    if (!user || !firestore) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    // Defer loading true to microtask as well to satisfy strict hooks rules
    queueMicrotask(() => setLoading(true));
    const docRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        queueMicrotask(() => setLoading(false));
      },
      () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        queueMicrotask(() => setLoading(false));
      }
    );
    return () => unsubscribeProfile();
  }, [user, firestore]);

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
      <FirebaseErrorListener />
      {children}
    </AuthContext.Provider>
  );
}

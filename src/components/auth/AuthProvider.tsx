
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
        setLoading(false);
        return;
    };
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If user logs out, clear profile and stop loading
        setUserProfile(null);
        setLoading(false);
      }
      // If user logs in, we wait for the profile snapshot to set loading to false
    });
    return () => unsubscribeAuth();
  }, [auth]);
  
  useEffect(() => {
    if (!user || !firestore) {
      // If there's no user, we don't need a profile.
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
           // This can happen briefly during signup before the user doc is created.
           // We keep loading until the document appears.
           setUserProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
        // Do not log out, let the error boundary handle it.
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

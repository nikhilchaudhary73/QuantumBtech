import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  phoneNumber: string | null;
  name?: string;
  email?: string;
  isBanned?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  verifyOldPassword: (oldPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  updateProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
  verifyOldPassword: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for hardcoded admin first (from local storage)
    const adminAuth = localStorage.getItem('btech_admin_auth');
    if (adminAuth === 'true') {
       setIsAdmin(true);
    } else {
       setIsAdmin(false);
    }

    if (!auth) {
      console.error("AuthContext: Firebase auth is undefined. Halting authentication listener.");
      setLoading(false);
      return;
    }

    let firestoreUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          // Initial base user info from Auth
          let baseAppUser: AppUser = {
             uid: firebaseUser.uid,
             phoneNumber: firebaseUser.phoneNumber,
             email: firebaseUser.email || undefined,
             name: firebaseUser.displayName || undefined,
          };

          // Attach real-time listener to Firestore user doc
          firestoreUnsubscribe = onSnapshot(userRef, async (userSnap) => {
             if (userSnap.exists()) {
                const data = userSnap.data();
                const mergedUser = { 
                   ...baseAppUser, 
                   ...data, 
                   // Firestore data.name takes priority
                   name: data.name || firebaseUser.displayName || undefined 
                };

                // If user is banned, sign them out immediately
                if (mergedUser.isBanned) {
                   await signOut(auth);
                   setCurrentUser(null);
                } else {
                   setCurrentUser(mergedUser);
                }
             } else {
                // If the doc doesn't exist, create it once with base info
                await setDoc(userRef, {
                  ...baseAppUser,
                  createdAt: new Date().toISOString()
                });
                setCurrentUser(baseAppUser);
             }
             setLoading(false);
          }, (error) => {
             console.error("AuthContext Firestore Snapshot Error:", error);
             // On permission or network error, fallback to Auth base user
             setCurrentUser(baseAppUser);
             setLoading(false);
          });
          
        } else {
          setCurrentUser(null);
          setLoading(false);
          if (firestoreUnsubscribe) {
             firestoreUnsubscribe();
             firestoreUnsubscribe = null;
          }
        }
      } catch (error) {
        console.error("AuthContext Error fetching user profile:", error);
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
       unsubscribeAuth();
       if (firestoreUnsubscribe) firestoreUnsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('btech_admin_auth');
    setIsAdmin(false);
  };

  const updateProfile = async (data: Partial<AppUser>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, data, { merge: true });
    setCurrentUser(prev => prev ? { ...prev, ...data } : null);
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!auth.currentUser) throw new Error("No user logged in to Firebase Auth");
    
    // Modern Firebase requires verifying the new email before it takes effect.
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
    // Note: We DO NOT update Firestore here yet, because the email hasn't actually changed 
    // until the user clicks the link in their inbox.
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("No user logged in to Firebase Auth");
    await updatePassword(auth.currentUser, newPassword);
  };

  const verifyOldPassword = async (oldPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) return false;
    try {
       const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
       await reauthenticateWithCredential(auth.currentUser, credential);
       return true;
    } catch (e) {
       return false;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, logout, updateProfile, updateUserEmail, updateUserPassword, verifyOldPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

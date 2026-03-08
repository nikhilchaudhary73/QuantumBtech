import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../utils/storage';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We do not have a robust user creation date tracking right now in Login.tsx
    // For now we will just query all users. In a prod app we'd query and sort by createdAt.
    const q = query(
      collection(db, 'users')
      // If we add createdAt later: orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          uid: doc.id,
          email: data.email || doc.id,
          name: data.name || data.phoneNumber || 'Unknown',
          mobile: data.phoneNumber || data.mobile || 'N/A',
          isBanned: data.isBanned || false,
          role: data.role || 'student',
          password: data.password || 'Securely Hash', // usually shouldn't show exact pwd
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A',
        } as any);
      });
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users realtime: ", err);
      setError("Failed to load users from the server.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleBanStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: !currentStatus
      });
      return { success: true };
    } catch (err: any) {
       console.error("Error toggling ban status: ", err);
       return { success: false, message: err.message };
    }
  };

  const updateUserByAdmin = async (userId: string, data: { name: string, email: string, mobile: string }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name: data.name,
        email: data.email,
        phoneNumber: data.mobile // matching the field Login.tsx uses
      });
      return { success: true };
    } catch (err: any) {
      console.error("Error updating user details:", err);
      return { success: false, message: err.message };
    }
  };

  return { users, loading, error, toggleBanStatus, updateUserByAdmin };
};

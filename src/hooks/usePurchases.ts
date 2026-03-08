import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Purchase } from '../utils/storage';

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to Firestore purchases collection in real-time
    // Ordered by timestamp so newest payments appear at the top
    const q = query(
      collection(db, 'purchases'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: Purchase[] = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Purchase);
        });
        setPurchases(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching purchases:', err);
        setError('Failed to load purchases.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const approvePurchase = async (id: string) => {
    try {
      await updateDoc(doc(db, 'purchases', id), { status: 'Approved' });
      return { success: true };
    } catch (err: any) {
      console.error('Error approving purchase:', err);
      return { success: false, message: err.message };
    }
  };

  const rejectPurchase = async (id: string) => {
    try {
      await updateDoc(doc(db, 'purchases', id), { status: 'Rejected' });
      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting purchase:', err);
      return { success: false, message: err.message };
    }
  };

  return { purchases, loading, error, approvePurchase, rejectPurchase };
};

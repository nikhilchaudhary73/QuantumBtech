import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Purchase, PurchaseItemType } from '../utils/storage';

/**
 * Real-time hook that listens to Firestore for the current user's purchases.
 * Replaces the localStorage-based getPurchaseStatus() for user-facing pages.
 */
export const useMyPurchases = (userEmail: string | null | undefined) => {
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail || !db) {
      setMyPurchases([]);
      setLoading(false);
      return;
    }

    // Listen to this user's purchases from Firestore in real-time
    const q = query(
      collection(db, 'purchases'),
      where('userEmail', '==', userEmail)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Purchase[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Purchase);
        });
        setMyPurchases(data);
        setLoading(false);
      },
      (err) => {
        console.error('useMyPurchases error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userEmail]);

  /**
   * Get the status of a specific purchase item. Returns the latest status.
   */
  const getPurchaseStatus = (
    courseId: string,
    itemType?: PurchaseItemType,
    itemId?: string
  ): 'None' | 'Pending' | 'Approved' | 'Rejected' => {
    let relevant = myPurchases.filter((p) => p.courseId === courseId);
    if (itemType && itemId) {
      relevant = relevant.filter((p) => p.itemType === itemType && p.itemId === itemId);
    }
    relevant.sort((a, b) => b.timestamp - a.timestamp);
    return relevant.length > 0 ? relevant[0].status : 'None';
  };

  const hasPurchased = (courseId: string): boolean => {
    return myPurchases.some((p) => p.courseId === courseId && p.status === 'Approved');
  };

  return { myPurchases, loading, getPurchaseStatus, hasPurchased };
};

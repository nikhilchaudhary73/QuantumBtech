import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProfileLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  changedBy?: string;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export const useProfileLogs = () => {
  const [logs, setLogs] = useState<ProfileLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'profileLogs'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: ProfileLog[] = [];
      snapshot.forEach(doc => {
        logsData.push({ id: doc.id, ...doc.data() } as ProfileLog);
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { logs, loading };
};

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PYQSemester } from '../data/pyqData';

export const usePYQs = () => {
  const [pyqs, setPyqs] = useState<PYQSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'pyqs'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pyqData: PYQSemester[] = [];
      querySnapshot.forEach((doc) => {
        pyqData.push(doc.data() as PYQSemester);
      });
      setPyqs(pyqData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching PYQs realtime: ", err);
      setError("Failed to load PYQs from the server.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const savePYQ = async (pyqSemester: PYQSemester) => {
    try {
      const docRef = doc(db, 'pyqs', pyqSemester.id);
      await setDoc(docRef, pyqSemester);
      return { success: true };
    } catch (err: any) {
      console.error("Error saving PYQ: ", err);
      return { success: false, message: err.message };
    }
  };
  
  const deletePYQ = async (id: string) => {
     try {
       await deleteDoc(doc(db, 'pyqs', id));
       return { success: true };
     } catch (err: any) {
       console.error('Error deleting PYQ:', err);
       return { success: false, message: err.message };
     }
  };

  return { pyqs, loading, error, savePYQ, deletePYQ };
};

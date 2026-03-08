import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Semester } from '../data/mockData';

export const useSemesters = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'semesters'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const semesterData: Semester[] = [];
      querySnapshot.forEach((doc) => {
        semesterData.push(doc.data() as Semester);
      });
      // Sort newest first based on the 'sem-timestamp' ID structure
      semesterData.sort((a, b) => b.id.localeCompare(a.id));
      
      setSemesters(semesterData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching semesters realtime: ", err);
      setError("Failed to load courses from the server.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveSemester = async (semester: Semester) => {
    try {
      const docRef = doc(db, 'semesters', semester.id);
      await setDoc(docRef, semester);
      return { success: true };
    } catch (err: any) {
      console.error("Error saving semester: ", err);
      return { success: false, message: err.message };
    }
  };
  
  const deleteSemester = async (id: string) => {
     try {
       await deleteDoc(doc(db, 'semesters', id));
       return { success: true };
     } catch (err: any) {
       console.error('Error deleting semester:', err);
       return { success: false, message: err.message };
     }
  };

  return { semesters, loading, error, saveSemester, deleteSemester };
};

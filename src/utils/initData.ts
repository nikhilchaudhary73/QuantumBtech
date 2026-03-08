import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockSemesters } from '../data/mockData';
import { mockPYQData } from '../data/pyqData';

export const seedFirestore = async () => {
  try {
    console.log('Starting Firestore Seeding...');

    // Seed Courses
    for (const semester of mockSemesters) {
      await setDoc(doc(db, 'semesters', semester.id), semester);
      console.log(`Seeded Course: ${semester.name}`);
    }

    // Seed PYQs
    for (const pyq of mockPYQData) {
      await setDoc(doc(db, 'pyqs', pyq.id), pyq);
      console.log(`Seeded PYQ: ${pyq.name}`);
    }

    console.log('Database Seeding Completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

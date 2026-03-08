import type { BranchType } from './mockData';

export interface PYQPaper {
  id: string;
  year: string; // e.g., '2025-2026' or '2023-2024'
  url: string;
}

export interface PYQSubject {
  id: string;
  name: string; // e.g., 'Engineering Mathematics I'
  papers: PYQPaper[];
}

export interface PYQSemester {
  id: string;
  branch: BranchType;
  name: string; // e.g., 'Semester 1'
  subjects: PYQSubject[];
}

export const mockPYQData: PYQSemester[] = [
  {
    id: 'pyq-sem-1-common',
    branch: 'Common',
    name: 'Semester 1',
    subjects: [
      {
        id: 'math-1',
        name: 'Engineering Mathematics I',
        papers: [
          { id: 'math-1-25', year: '2025-2026', url: '/sample.pdf' },
          { id: 'math-1-24', year: '2023-2024', url: '/sample.pdf' },
          { id: 'math-1-23', year: '2022-2023', url: '/sample.pdf' }
        ]
      },
      {
        id: 'phy-1',
        name: 'Engineering Physics',
        papers: [
          { id: 'phy-1-25', year: '2025-2026', url: '/sample.pdf' },
          { id: 'phy-1-24', year: '2024-2025', url: '/sample.pdf' }
        ]
      }
    ]
  },
  {
    id: 'pyq-sem-3-cse',
    branch: 'CSE',
    name: 'Semester 3',
    subjects: [
      {
        id: 'dsa',
        name: 'Data Structures & Algorithms',
        papers: [
          { id: 'dsa-25', year: '2025-2026', url: '/sample.pdf' },
          { id: 'dsa-24', year: '2024-2025', url: '/sample.pdf' }
        ]
      },
      {
        id: 'dld',
        name: 'Digital Logic Design',
        papers: [
          { id: 'dld-25', year: '2025-2026', url: '/sample.pdf' },
          { id: 'dld-23', year: '2023-2024', url: '/sample.pdf' }
        ]
      }
    ]
  },
  {
    id: 'pyq-sem-3-me',
    branch: 'ME',
    name: 'Semester 3',
    subjects: [
      {
        id: 'thermo',
        name: 'Thermodynamics',
        papers: [
          { id: 'thermo-25', year: '2025-2026', url: '/sample.pdf' }
        ]
      }
    ]
  }
];

const PYQ_KEY = 'btech_pyqs';

export const getPYQData = (): PYQSemester[] => {
  const data = localStorage.getItem(PYQ_KEY);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(PYQ_KEY, JSON.stringify(mockPYQData));
  return mockPYQData;
};

export const savePYQData = (semesters: PYQSemester[]) => {
  localStorage.setItem(PYQ_KEY, JSON.stringify(semesters));
};

export const getPYQSemesterById = (id: string): PYQSemester | undefined => {
  return getPYQData().find(sem => sem.id === id);
};

export const getPYQSubjectById = (semesterId: string, subjectId: string): PYQSubject | undefined => {
  const sem = getPYQSemesterById(semesterId);
  return sem?.subjects.find(sub => sub.id === subjectId);
};

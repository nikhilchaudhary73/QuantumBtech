export type BranchType = 'CSE' | 'IT' | 'ME' | 'ECE' | 'EE' | 'CE' | 'Common';

export interface Subject {
  id: string;
  name: string;
  notesPrice: number;
  quantumPrice: number;
  notesUrl: string;
  quantumUrl: string;
}

export interface Semester {
  id: string;
  branch: BranchType;
  name: string;
  title: string;
  description: string;
  subjects: Subject[];
  comboPrice: number;
  validity: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountFlat: number;     // e.g., 50 rupees off
  discountPercent: number;  // e.g., 10% off
  applicableItemId?: string; // Optional: specify combo ID or subject ID. If null, applies to anything
}

export const mockSemesters: Semester[] = [
  {
    id: "sem-1",
    branch: "Common",
    name: "Semester 1",
    title: "B.Tech Semester 1 Complete Study Material",
    description: "Comprehensive notes and Quantum guides for all Semester 1 subjects.",
    comboPrice: 249,
    validity: "6 Months",
    subjects: [
      { id: "math-1", name: "Engineering Mathematics I", notesPrice: 49, quantumPrice: 69, notesUrl: "/sample.pdf", quantumUrl: "/sample.pdf" },
      { id: "phy-1", name: "Engineering Physics", notesPrice: 49, quantumPrice: 69, notesUrl: "/sample.pdf", quantumUrl: "/sample.pdf" }
    ]
  },
  {
    id: "sem-3-cse",
    branch: "CSE",
    name: "Semester 3 (CSE)",
    title: "Computer Science Core Semester 3",
    description: "Core CSE engineering subjects. Essential resources for DSA and Logic Design.",
    comboPrice: 299,
    validity: "6 Months",
    subjects: [
      { id: "dsa", name: "Data Structures & Algorithms", notesPrice: 99, quantumPrice: 149, notesUrl: "/sample.pdf", quantumUrl: "/sample.pdf" },
      { id: "dld", name: "Digital Logic Design", notesPrice: 89, quantumPrice: 129, notesUrl: "/sample.pdf", quantumUrl: "/sample.pdf" }
    ]
  },
  {
    id: "sem-3-me",
    branch: "ME",
    name: "Semester 3 (ME)",
    title: "Mechanical Core Semester 3",
    description: "Core Mechanical engineering subjects including Thermodynamics.",
    comboPrice: 249,
    validity: "6 Months",
    subjects: [
      { id: "thermo", name: "Thermodynamics", notesPrice: 79, quantumPrice: 99, notesUrl: "/sample.pdf", quantumUrl: "/sample.pdf" }
    ]
  }
];

export const mockCoupons: Coupon[] = [
  { id: "c1", code: "WELCOME50", discountFlat: 50, discountPercent: 0 },
  { id: "c2", code: "DSA10", discountFlat: 0, discountPercent: 10, applicableItemId: "dsa" }
];

const COURSES_KEY = 'btech_courses';

export const getSemesters = (): Semester[] => {
  const data = localStorage.getItem(COURSES_KEY);
  if (data) {
    // Basic migration check for old structure
    let parsed: Semester[] = JSON.parse(data);
    let needsUpdate = false;

    if (parsed.length > 0) {
      if (parsed[0].branch === undefined) {
        parsed = mockSemesters;
        needsUpdate = true;
      } else if (parsed[0].validity === undefined) {
        parsed = parsed.map((p) => ({ ...p, validity: p.validity || "6 Months" }));
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
       localStorage.setItem(COURSES_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } else {
    localStorage.setItem(COURSES_KEY, JSON.stringify(mockSemesters));
    return mockSemesters;
  }
};

export const saveSemesters = (semesters: Semester[]) => {
  localStorage.setItem(COURSES_KEY, JSON.stringify(semesters));
};

export const getSemesterById = (id: string) => getSemesters().find(s => s.id === id);


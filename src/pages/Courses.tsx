import React, { useState } from 'react';
import { Search, Filter, Book, Loader2 } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { useSemesters } from '../hooks/useSemesters';
import type { BranchType } from '../data/mockData';

const BRANCHES: BranchType[] = ['CSE', 'IT', 'ME', 'ECE', 'EE', 'CE'];

const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState<BranchType | 'All'>('All');
  
  const { semesters, loading, error } = useSemesters();

  const filtered = semesters.filter(sem => {
    const matchesSearch = sem.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sem.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = activeBranch === 'All' || sem.branch === activeBranch || sem.branch === 'Common';

    return matchesSearch && matchesBranch;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
         <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (error) {
     return (
       <div className="min-h-screen pt-24 pb-12 flex justify-center items-center text-rose-500 font-bold">
          {error}
       </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">All Courses & Semesters</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">Discover premium notes and Quantum PDFs for every semester.</p>
        </div>
        
        <div className="w-full md:w-auto flex gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search semesters..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>
          <button className="px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveBranch('All')}
          className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            activeBranch === 'All'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          All Branches
        </button>
        {BRANCHES.map(branch => (
          <button
            key={branch}
            onClick={() => setActiveBranch(branch)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              activeBranch === branch
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-transparent dark:border-indigo-800 dark:hover:bg-indigo-900/40'
            }`}
          >
            {branch}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filtered.map((sem, idx) => (
            <CourseCard key={sem.id} semester={sem} index={idx} />
          ))}
        </div>
      ) : (
        <div className="col-span-full py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400">
            <Book size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Courses Found</h3>
          <p className="text-slate-500">We couldn't find any courses matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePYQs } from '../hooks/usePYQs';
import type { BranchType } from '../data/mockData';
import { BookOpen, FolderOpen, ChevronRight, Loader2 } from 'lucide-react';

const BRANCH_OPTIONS: BranchType[] = ['Common', 'CSE', 'IT', 'ME', 'ECE', 'EE', 'CE'];

const PYQHome: React.FC = () => {
  const [activeBranch, setActiveBranch] = useState<BranchType>('Common');
  const { pyqs, loading, error } = usePYQs();
  
  const semesters = useMemo(() => {
    return pyqs.filter(sem => sem.branch === activeBranch);
  }, [activeBranch, pyqs]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          Previous Year <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400">Questions</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Access our comprehensive vault of past exam papers. Select your branch and semester to find free authentic PYQs.
        </p>
      </div>

      {/* Branch Selection */}
      <div className="mb-12">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Select Branch</h2>
        <div className="flex flex-wrap gap-3">
          {BRANCH_OPTIONS.map((branch) => (
            <button
              key={branch}
              onClick={() => setActiveBranch(branch)}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeBranch === branch 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 -translate-y-1' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* Semesters Grid */}
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <FolderOpen className="text-indigo-500" />
          {activeBranch} Semesters
        </h2>
        
        {loading ? (
           <div className="flex justify-center py-12">
             <Loader2 className="animate-spin text-indigo-500" size={32} />
           </div>
        ) : error ? (
           <div className="text-center py-12 text-rose-500 font-medium">
             {error}
           </div>
        ) : semesters.length === 0 ? (
          <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No PYQs Available</h3>
            <p className="text-slate-500">We are currently updating our database for {activeBranch}. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.map((sem) => (
              <Link
                key={sem.id}
                to={`/pyqs/semester/${sem.id}`}
                className="group bg-white/70 backdrop-blur-md dark:bg-slate-900/70 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-500 transition-colors">
                  {sem.name}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  {sem.subjects.length} Subjects Available
                </p>
                <div className="mt-auto flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all">
                  View Subjects <ChevronRight size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PYQHome;

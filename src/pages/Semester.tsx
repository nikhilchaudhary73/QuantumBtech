import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSemesters } from '../hooks/useSemesters';
import { BookOpen, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Semester: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { semesters, loading } = useSemesters();

  const semester = useMemo(() => {
    if (!id || semesters.length === 0) return null;
    return semesters.find(sem => sem.id === id) || null;
  }, [id, semesters]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
         <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Semester Not Found</h1>
        <Link to="/courses" className="text-indigo-500 hover:underline">Return to Courses</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">{semester.title}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl">{semester.description}</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-full">
            Price: ₹{semester.comboPrice} <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 opacity-90">/ {semester.validity}</span>
          </span>
          <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-bold rounded-full">
            {semester.subjects.length} Subjects
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {semester.subjects.map((sub, i) => (
          <motion.div 
            key={sub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl text-indigo-500">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Includes Notes, Quantum, and PYQs.</p>
              </div>
            </div>
            <Link 
              to={`/subject/${semester.id}/${sub.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl font-semibold transition-colors mt-2 sm:mt-0 w-full sm:w-auto justify-center"
            >
              View Detail <ArrowRight size={18} />
            </Link>
          </motion.div>
        ))}
        {semester.subjects.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500">Subjects are being updated for this semester.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Semester;

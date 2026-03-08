import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book, ChevronRight, Tag } from 'lucide-react';
import type { Semester } from '../data/mockData';

interface CourseCardProps {
  semester: Semester;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ semester, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/30 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Book size={24} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-3 py-1 text-xs font-bold text-cyan-700 bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-400 rounded-full">
              {semester.subjects.length} Subjects
            </span>
            <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400 rounded-full uppercase">
              <Tag size={10} /> {semester.branch}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{semester.name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2 h-10">
          {semester.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Combo Pack</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              ₹{semester.comboPrice} <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">/ {semester.validity}</span>
            </span>
          </div>
          
          <Link 
            to={`/semester/${semester.id}`}
            className="flex items-center gap-1 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold text-sm hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-colors group-hover:scale-105"
          >
            View Notes <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;

import React, { useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePYQs } from '../hooks/usePYQs';
import { BookOpen, ArrowLeft, GraduationCap, ChevronRight, FileText, Loader2 } from 'lucide-react';

const PYQSemesterDetail: React.FC = () => {
  const { semesterId } = useParams<{ semesterId: string }>();
  const navigate = useNavigate();
  const { pyqs, loading } = usePYQs();

  const semester = useMemo(() => {
    if (!semesterId || pyqs.length === 0) return null;
    return pyqs.find(sem => sem.id === semesterId) || null;
  }, [semesterId, pyqs]);

  useEffect(() => {
    if (!loading && semesterId && !semester) {
      navigate('/pyqs');
    }
  }, [semester, semesterId, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
         <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!semester) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      <Link to="/pyqs" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all mb-8">
        <ArrowLeft size={20} /> Back to PYQs
      </Link>

      {/* Header Info */}
      <div className="bg-white/70 backdrop-blur-md dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute -top-24 -right-24 text-indigo-500/10 dark:text-indigo-500/5 rotate-12">
          <GraduationCap size={250} />
        </div>
        
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm tracking-widest rounded-full mb-4 uppercase">
            {semester.branch} Branch
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            {semester.name}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Choose a subject below to view and download previous year question papers. All papers are verified and free.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Subject List</h2>

      {/* Subjects Stack */}
      <div className="space-y-4">
        {semester.subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`/pyqs/subject/${semester.id}/${subject.id}`}
            className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4 mb-4 md:mb-0">
               <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 dark:group-hover:bg-indigo-900/30 transition-colors">
                 <BookOpen size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{subject.name}</h3>
                 <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <FileText size={14} /> {subject.papers.length} Papers Available
                 </p>
               </div>
            </div>
            
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold self-end md:self-auto group-hover:translate-x-1 transition-transform">
              View Papers <ChevronRight size={20} />
            </div>
          </Link>
        ))}
        {semester.subjects.length === 0 && (
           <p className="text-slate-500 text-center py-8">No subjects have been mapped to this semester yet.</p>
        )}
      </div>

    </div>
  );
};

export default PYQSemesterDetail;

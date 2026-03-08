import React, { useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePYQs } from '../hooks/usePYQs';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, ArrowLeft, FileText, Download, Eye, Lock, Loader2 } from 'lucide-react';

const PYQSubjectDetail: React.FC = () => {
  const { semesterId, subjectId } = useParams<{ semesterId: string, subjectId: string }>();
  const navigate = useNavigate();
  
  const { currentUser } = useAuth();
  const { pyqs, loading } = usePYQs();

  const { semester, subject } = useMemo(() => {
    if (!semesterId || !subjectId || pyqs.length === 0) return { semester: null, subject: null };
    const sem = pyqs.find(s => s.id === semesterId);
    const sub = sem?.subjects.find(s => s.id === subjectId);
    return {
      semester: sem || null,
      subject: sub || null
    };
  }, [semesterId, subjectId, pyqs]);

  useEffect(() => {
    if (!loading && semesterId && subjectId && (!semester || !subject)) {
      navigate('/pyqs');
    }
  }, [semester, subject, semesterId, subjectId, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
         <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!semester || !subject) return null;

  const handleAction = (url: string, action: 'preview' | 'download') => {
    if (!currentUser) {
      // Must be logged in
      const confirmLogin = window.confirm("You must be logged in to view or download PYQs. Go to Login?");
      if (confirmLogin) {
         navigate('/login');
      }
      return;
    }

    if (action === 'preview') {
      window.open(url, '_blank');
    } else if (action === 'download') {
      // Create a temporary anchor tag to trigger a download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subject.name.replace(/\s+/g, '_')}_PYQ.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      <Link to={`/pyqs/semester/${semester.id}`} className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all mb-8">
        <ArrowLeft size={20} /> Back to {semester.name}
      </Link>

      <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
        <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm tracking-widest rounded-full mb-4 uppercase">
          {semester.branch} • {semester.name}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-4">
          <BookOpen className="text-indigo-500" size={40} />
          {subject.name}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          Previous year question papers. Content is free for all registered students.
        </p>

        {!currentUser && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400">
            <Lock className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Authentication Required</p>
              <p className="text-sm mt-1">You need to log in to access these files. <Link to="/login" className="underline font-bold">Log in here</Link>.</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {subject.papers.map((paper) => (
          <div key={paper.id} className="bg-white/70 backdrop-blur-md dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                 <FileText size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{subject.name} for {paper.year}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 font-medium mt-1">
                     Question Paper PDF
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => handleAction(paper.url, 'preview')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl transition-colors"
                title="Preview Online"
              >
                <Eye size={18} /> Preview
              </button>
              <button 
                onClick={() => handleAction(paper.url, 'download')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                title="Download PDF"
              >
                <Download size={18} /> Download
              </button>
            </div>
          </div>
        ))}
        {subject.papers.length === 0 && (
           <p className="text-slate-500 text-center py-12">No papers are currently available for this subject.</p>
        )}
      </div>

    </div>
  );
};

export default PYQSubjectDetail;

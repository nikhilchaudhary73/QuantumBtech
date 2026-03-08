import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSemesters } from '../hooks/useSemesters';
import { Download, Lock, CheckCircle, AlertCircle, FileText, Star, Loader2 } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { useMyPurchases } from '../hooks/useMyPurchases';
import type { PurchaseItemType } from '../utils/storage';

const CourseDetail: React.FC = () => {
  const { semesterId, subjectId } = useParams<{ semesterId: string, subjectId: string }>();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Track which item the user is trying to buy right now
  const [buyingConfig, setBuyingConfig] = useState<{
    name: string;
    id: string; // The specific itemId
    price: number;
    type: PurchaseItemType;
  } | null>(null);

  const { currentUser: user } = useAuth();
  const { semesters, loading } = useSemesters();

  const { semester, subject } = useMemo(() => {
    if (!semesterId || semesters.length === 0) return { semester: null, subject: null };
    const sem = semesters.find(s => s.id === semesterId);
    const sub = sem?.subjects.find(s => s.id === subjectId);
    return {
      semester: sem || null,
      subject: sub || null
    };
  }, [semesterId, subjectId, semesters]);

  useEffect(() => {
    if (!loading && semesterId && subjectId && (!semester || !subject)) {
      navigate('/courses');
    }
  }, [semester, subject, semesterId, subjectId, navigate, loading]);

  const setRefreshCounter = useState(0)[1];

  // Real-time purchase status from Firestore
  const userIdentifier = user?.email || user?.phoneNumber || '';
  const { getPurchaseStatus } = useMyPurchases(userIdentifier || null);

  // Define granular purchase statuses — these update live when admin approves/rejects
  const comboStatus = user && userIdentifier && semester && subject ? getPurchaseStatus(semester.id, 'combo', semester.id) : 'None';
  const notesStatus = user && userIdentifier && semester && subject ? getPurchaseStatus(semester.id, 'subject-notes', subject.id) : 'None';
  const quantumStatus = user && userIdentifier && semester && subject ? getPurchaseStatus(semester.id, 'subject-quantum', subject.id) : 'None';

  const updateStatuses = () => {
    setRefreshCounter(prev => prev + 1); // no-op now but kept for backward compat
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
         <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!semester || !subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Subject Not Found</h1>
        <Link to="/courses" className="text-indigo-500 hover:underline">Return to Courses</Link>
      </div>
    );
  }

  const handleBuy = (name: string, id: string, price: number, type: PurchaseItemType) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBuyingConfig({ name, id, price, type });
    setPaymentModalOpen(true);
  };

  // Checking if access is granted via Combo OR specific purchase
  const hasNotesAccess = comboStatus === 'Approved' || notesStatus === 'Approved';
  const hasQuantumAccess = comboStatus === 'Approved' || quantumStatus === 'Approved';
  
  const isNotesPending = comboStatus === 'Pending' || notesStatus === 'Pending';
  const isQuantumPending = comboStatus === 'Pending' || quantumStatus === 'Pending';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex justify-between items-start flex-col gap-12">
        <div className="w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold mb-6">
            <Link to="/courses" className="hover:text-indigo-500">Courses</Link>
            <span>/</span>
            <Link to={`/semester/${semester.id}`} className="hover:text-indigo-500">{semester.name}</Link>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400">{subject.name}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
            {subject.name}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-3xl">
            Master the core concepts of {subject.name} with our premium, exam-oriented study materials. Choose exactly what you need to study.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
             
             {/* NOTES PURCHASE CARD */}
             <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col hover:border-indigo-500/50 transition-colors shadow-sm">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 w-max rounded-xl mb-4">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Subject Notes</h3>
                <p className="text-sm text-slate-500 mb-6 flex-1">Complete unit-wise detailed notes as per the university syllabus.</p>
                
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    ₹{subject.notesPrice} <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">/ {semester.validity}</span>
                  </span>
                </div>

                {hasNotesAccess ? (
                  <div className="flex flex-col gap-2">
                    <a href={subject.notesUrl} download className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-transform active:scale-95">
                      <Download size={18} /> Download Notes
                    </a>
                    <Link 
                      to={`/preview/${semester.id}/${subject.id}/notes`}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition-all border border-indigo-200 dark:border-slate-700"
                    >
                      Preview Online
                    </Link>
                  </div>
                ) : isNotesPending ? (
                  <button disabled className="py-3 bg-amber-500 text-white rounded-xl font-bold opacity-80 cursor-not-allowed flex items-center justify-center gap-2">
                    <AlertCircle size={18} /> Verification Pending
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleBuy(`${subject.name} - Notes`, subject.id, subject.notesPrice, 'subject-notes')}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-50 rounded-xl font-bold transition-all"
                    >
                      <Lock size={18} /> Buy Notes Only
                    </button>
                    <button 
                      onClick={() => alert("Buy Course to view and download all Course Pdf")}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition-all border border-indigo-200 dark:border-slate-700"
                    >
                      Preview Online
                    </button>
                  </div>
                )}
             </div>

             {/* QUANTUM PURCHASE CARD */}
             <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col hover:border-cyan-500/50 transition-colors shadow-sm">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 w-max rounded-xl mb-4">
                  <Star size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Quantum Series</h3>
                <p className="text-sm text-slate-500 mb-6 flex-1">Premium previous year questions with detailed solutions and important topics.</p>
                
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    ₹{subject.quantumPrice} <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">/ {semester.validity}</span>
                  </span>
                </div>

                {hasQuantumAccess ? (
                  <div className="flex flex-col gap-2">
                    <a href={subject.quantumUrl} download className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-transform active:scale-95">
                      <Download size={18} /> Download Quantum
                    </a>
                    <Link 
                      to={`/preview/${semester.id}/${subject.id}/quantum`}
                      className="flex items-center justify-center gap-2 py-3 bg-cyan-50 hover:bg-cyan-100 dark:bg-slate-800 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 rounded-xl font-bold transition-all border border-cyan-200 dark:border-slate-700"
                    >
                      Preview Online
                    </Link>
                  </div>
                ) : isQuantumPending ? (
                  <button disabled className="py-3 bg-amber-500 text-white rounded-xl font-bold opacity-80 cursor-not-allowed flex items-center justify-center gap-2">
                    <AlertCircle size={18} /> Verification Pending
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleBuy(`${subject.name} - Quantum`, subject.id, subject.quantumPrice, 'subject-quantum')}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-cyan-600 dark:hover:bg-cyan-50 rounded-xl font-bold transition-all"
                    >
                      <Lock size={18} /> Buy Quantum Only
                    </button>
                    <button 
                      onClick={() => alert("Buy Course to view and download all Course Pdf")}
                      className="flex items-center justify-center gap-2 py-3 bg-cyan-50 hover:bg-cyan-100 dark:bg-slate-800 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 rounded-xl font-bold transition-all border border-cyan-200 dark:border-slate-700"
                    >
                      Preview Online
                    </button>
                  </div>
                )}
             </div>

             {/* COMBO PURCHASE CARD */}
             <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 border-0 rounded-2xl p-6 flex flex-col shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold w-max mb-4 backdrop-blur-sm">
                    BEST VALUE
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Full Semester Combo</h3>
                  <p className="text-sm text-indigo-100 mb-6 flex-1">Unlock Notes & Quantums for ALL subjects in {semester.name} at a massive discount.</p>
                  
                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-4xl font-extrabold">
                      ₹{semester.comboPrice} <span className="text-lg font-semibold text-white opacity-100">/ {semester.validity}</span>
                    </span>
                    <span className="text-sm font-medium text-indigo-200 line-through pb-1">₹{semester.comboPrice * 2}</span>
                  </div>

                  {comboStatus === 'Approved' ? (
                    <div className="flex items-center justify-center gap-2 py-3 bg-white text-green-600 rounded-xl font-bold">
                      <CheckCircle size={18} /> Combo Unlocked
                    </div>
                  ) : comboStatus === 'Pending' ? (
                    <button disabled className="py-3 bg-white/20 text-white rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                      <AlertCircle size={18} /> Verification Pending
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBuy(`${semester.name} - Full Combo`, semester.id, semester.comboPrice, 'combo')}
                      className="flex items-center justify-center gap-2 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
                    >
                      <Lock size={18} /> Buy Full Combo
                    </button>
                  )}
                </div>
             </div>

          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        courseName={buyingConfig?.name || ''}
        courseId={semester.id} // The root container ID is the semester
        itemId={buyingConfig?.id || ''}
        itemType={buyingConfig?.type || 'combo'}
        price={buyingConfig?.price || 0}
        onSuccess={() => {
          updateStatuses();
        }}
      />
    </div>
  );
};

export default CourseDetail;

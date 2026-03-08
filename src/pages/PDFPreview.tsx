import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSemesters } from '../hooks/useSemesters';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import PDFViewerComponent from '../components/PDFViewerComponent';
import { useAuth } from '../contexts/AuthContext';
import { useMyPurchases } from '../hooks/useMyPurchases';

const PDFPreview: React.FC = () => {
  const { semesterId, subjectId, type } = useParams<{ semesterId: string, subjectId: string, type: string }>();
  const navigate = useNavigate();
  
  const { semesters, loading } = useSemesters();
  
  const semester = semesters.find(s => s.id === semesterId);
  const subject = semester?.subjects.find(s => s.id === subjectId);
  const { currentUser: user } = useAuth();

  // Real-time purchase status from Firestore
  const userEmail = user?.email || null;
  const { getPurchaseStatus } = useMyPurchases(userEmail);

  let purchaseStatus: 'None' | 'Pending' | 'Approved' | 'Rejected' = 'None';
  
  if (user && user.email && semester && subject) {
    const comboStatus = getPurchaseStatus(semester.id, 'combo', semester.id);
    const notesStatus = getPurchaseStatus(semester.id, 'subject-notes', subject.id);
    const quantumStatus = getPurchaseStatus(semester.id, 'subject-quantum', subject.id);
    
    if (comboStatus === 'Approved' || notesStatus === 'Approved' || quantumStatus === 'Approved') {
       purchaseStatus = 'Approved';
    } else if (comboStatus === 'Pending' || notesStatus === 'Pending' || quantumStatus === 'Pending') {
       purchaseStatus = 'Pending';
    } else if (comboStatus === 'Rejected' || notesStatus === 'Rejected' || quantumStatus === 'Rejected') {
       purchaseStatus = 'Rejected';
    }
  }

  const isPurchased = purchaseStatus === 'Approved';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h1 className="text-xl font-bold">Loading Preview...</h1>
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

  // Using real PDF URLs from Firestore data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-2 font-medium"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {subject.name} - {type === 'notes' ? 'Notes' : 'Quantum'} Preview
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1 font-bold">
              <Lock size={12} /> Preview Mode (Download Disabled)
            </span>
          </h1>
        </div>
        
        {!isPurchased && (
          <Link 
            to={`/subject/${semester.id}/${subject.id}`}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            Buy to Download
          </Link>
        )}
      </div>

      <PDFViewerComponent 
        url={type === 'notes' ? subject.notesUrl : subject.quantumUrl} 
        isPurchased={isPurchased}
        buyLink={`/subject/${semester.id}/${subject.id}`}
      />
      
    </div>
  );
};

export default PDFPreview;

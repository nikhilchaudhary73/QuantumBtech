import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, logoutAdmin } from '../utils/auth';
import { getCoupons, saveCoupon, deleteCoupon } from '../utils/storage';
import { uploadFileToAppwrite } from '../lib/appwrite';
import { useUsers } from '../hooks/useUsers';
import { usePurchases } from '../hooks/usePurchases';
import type { Semester, Subject, Coupon, BranchType } from '../data/mockData';
import type { PYQSemester, PYQPaper } from '../data/pyqData';
import type { User, SupportMessage, Purchase } from '../utils/storage';
import { db } from '../lib/firebase';
import { usePYQs } from '../hooks/usePYQs';
import { useSemesters } from '../hooks/useSemesters';
import { useProfileLogs } from '../hooks/useProfileLogs';
import { useSupport } from '../hooks/useSupport';
import { Users, ShoppingBag, IndianRupee, LogOut, CheckCircle, XCircle, LayoutDashboard, BookOpen, Plus, Edit, Trash2, Upload, Tag, HelpCircle, MessageSquare, FileText, Activity } from 'lucide-react';

const BRANCH_OPTIONS: BranchType[] = ['Common', 'CSE', 'IT', 'ME', 'ECE', 'EE', 'CE'];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'coupons' | 'support' | 'pyqs' | 'profile-logs'>('overview');
  
  // Real-time data from Firestore
  const { purchases, approvePurchase, rejectPurchase } = usePurchases();
  const { users, toggleBanStatus, updateUserByAdmin } = useUsers();
  const { semesters, saveSemester, deleteSemester } = useSemesters();
  const { logs: profileLogs, loading: logsLoading } = useProfileLogs();
  const { messages: supportMessages, replyMessage } = useSupport();
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [editingUser, setEditingUser] = useState<(User & { uid?: string }) | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  // PYQ State
  const { pyqs: pyqSemesters, savePYQ, deletePYQ } = usePYQs();
  const [editingPyqSemester, setEditingPyqSemester] = useState<PYQSemester | null>(null);
  
  // Coupon Adding State
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ code: '', discountPercent: 0, discountFlat: 0 });

  const loadData = () => {
    // Purchases now come from usePurchases real-time hook
    setCoupons(getCoupons());
  };

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/login');
    }
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  // --- User Actions ---
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.uid) return;

    // Find original user to see what changed
    const originalUser = users.find((u: any) => u.uid === editingUser.uid);
    
    // Save to Firestore
    const result = await updateUserByAdmin(editingUser.uid, {
       name: editingUser.name,
       email: editingUser.email,
       mobile: editingUser.mobile || ''
    });

    if (result.success && originalUser) {
       // Log changes
       const changes: { field: string, oldValue: string, newValue: string }[] = [];
       if (originalUser.name !== editingUser.name) changes.push({ field: 'name', oldValue: originalUser.name || '', newValue: editingUser.name });
       if (originalUser.email !== editingUser.email) changes.push({ field: 'email', oldValue: originalUser.email || '', newValue: editingUser.email });
       if ((originalUser as any).mobile !== editingUser.mobile) changes.push({ field: 'mobile', oldValue: (originalUser as any).mobile || '', newValue: editingUser.mobile || '' });

       if (changes.length > 0) {
           import('firebase/firestore').then(({ addDoc, collection }) => {
               addDoc(collection(db, 'profileLogs'), {
                   userId: editingUser.uid,
                   userEmail: editingUser.email,
                   userName: editingUser.name,
                   changedBy: 'Admin',
                   timestamp: new Date().toISOString(),
                   changes: changes
               });
           });
       }

       alert("User updated successfully!");
       setEditingUser(null);
    } else {
       alert("Failed to update user: " + result.message);
    }
  };

  // --- Purchase Actions ---
  const handleApprove = async (id: string) => {
    if (window.confirm('Approve this payment and grant access?')) {
      const result = await approvePurchase(id);
      if (result && !result.success) alert(`Approval failed: ${result.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm('Reject this payment?')) {
      const result = await rejectPurchase(id);
      if (result && !result.success) alert(`Rejection failed: ${result.message}`);
    }
  };

  // --- Course Actions ---
  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSemester) return;
    
    const result = await saveSemester(editingSemester);
    if (result && !result.success) {
      alert(`Failed to save course: ${result.message}`);
    } else {
      setEditingSemester(null);
      alert('Course Package saved successfully!');
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entire semester/course?')) {
      await deleteSemester(id);
    }
  };

  const createNewSemester = () => {
    setEditingSemester({
      id: `sem-${Date.now()}`,
      name: 'New Semester',
      branch: 'Common',
      title: 'Course Package Title',
      description: 'Description here...',
      comboPrice: 299,
      validity: '6 Months',
      subjects: []
    });
  };

  // Subjects within Editing Semester
  const addSubject = () => {
    if (!editingSemester) return;
    setEditingSemester({
      ...editingSemester,
      subjects: [
        ...editingSemester.subjects,
        { 
          id: `sub-${Date.now()}`, 
          name: 'New Subject', 
          notesPrice: 49,
          quantumPrice: 29,
          notesUrl: '', 
          quantumUrl: ''
        }
      ]
    });
  };

  const updateSubject = (subId: string, field: keyof Subject, value: string | number) => {
    if (!editingSemester) return;
    const updatedSubjects = editingSemester.subjects.map((s: Subject) => 
      s.id === subId ? { ...s, [field]: value } : s
    );
    setEditingSemester({ ...editingSemester, subjects: updatedSubjects });
  };

  const removeSubject = (subId: string) => {
    if (!editingSemester) return;
    setEditingSemester({
      ...editingSemester,
      subjects: editingSemester.subjects.filter((s: Subject) => s.id !== subId)
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, subId: string, field: keyof Subject) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Temporary UI feedback, in real app add a visual loading state
        alert(`Uploading "${file.name}" to cloud storage. Please wait...`);
        const downloadURL = await uploadFileToAppwrite(file);
        
        updateSubject(subId, field, downloadURL);
        alert(`File "${file.name}" uploaded successfully!`);
      } catch (error: any) {
        console.error("Upload failed", error);
        alert(`File upload failed: ${error.message}`);
      }
    }
  };

  // --- Coupon Actions ---
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;

    const couponToSave: Coupon = {
      id: `coup-${Date.now()}`,
      code: newCoupon.code,
      discountPercent: newCoupon.discountPercent || 0,
      discountFlat: newCoupon.discountFlat || 0,
      applicableItemId: newCoupon.applicableItemId || undefined,
    };

    saveCoupon(couponToSave);
    setNewCoupon({ code: '', discountPercent: 0, discountFlat: 0 });
    loadData();
  };

  const handleRemoveCoupon = (id: string) => {
    if (window.confirm('Delete this coupon?')) {
      deleteCoupon(id);
      loadData();
    }
  };

  const getItemNameForCoupon = (itemId?: string) => {
    if (!itemId) return 'All Items (Global)';
    for (const sem of semesters) {
      if (sem.id === itemId) return `Combo: ${sem.name}`;
      const sub = sem.subjects.find(s => s.id === itemId);
      if (sub) return `Subject: ${sub.name} (in ${sem.name})`;
    }
    return `ID: ${itemId}`;
  };

  // --- PYQ Actions ---
  const handleSavePyqSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPyqSemester) return;
    
    const result = await savePYQ(editingPyqSemester);
    if (result && !result.success) {
      alert(`Failed to save PYQ Semester: ${result.message}`);
    } else {
      setEditingPyqSemester(null);
      alert('PYQ Semester saved successfully!');
    }
  };

  const handleDeletePyqSemester = async (id: string) => {
    if (window.confirm('Delete this PYQ Semester?')) {
      await deletePYQ(id);
    }
  };

  const createNewPyqSemester = () => {
    setEditingPyqSemester({
      id: `pyq-sem-${Date.now()}`,
      branch: 'Common',
      name: 'New PYQ Semester',
      subjects: []
    });
  };

  const addPyqSubject = () => {
    if (!editingPyqSemester) return;
    setEditingPyqSemester({
      ...editingPyqSemester,
      subjects: [
        ...editingPyqSemester.subjects,
        { id: `pyq-sub-${Date.now()}`, name: 'New Subject', papers: [] }
      ]
    });
  };

  const updatePyqSubject = (subId: string, name: string) => {
    if (!editingPyqSemester) return;
    const updated = editingPyqSemester.subjects.map(s => 
      s.id === subId ? { ...s, name } : s
    );
    setEditingPyqSemester({ ...editingPyqSemester, subjects: updated });
  };

  const removePyqSubject = (subId: string) => {
    if (!editingPyqSemester) return;
    setEditingPyqSemester({
      ...editingPyqSemester,
      subjects: editingPyqSemester.subjects.filter(s => s.id !== subId)
    });
  };

  const addPyqPaper = (subId: string) => {
    if (!editingPyqSemester) return;
    const updated = editingPyqSemester.subjects.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          papers: [...s.papers, { id: `pyq-pap-${Date.now()}`, year: new Date().getFullYear().toString(), url: '' }]
        };
      }
      return s;
    });
    setEditingPyqSemester({ ...editingPyqSemester, subjects: updated });
  };

  const updatePyqPaper = (subId: string, paperId: string, field: keyof PYQPaper, value: string) => {
    if (!editingPyqSemester) return;
    const updated = editingPyqSemester.subjects.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          papers: s.papers.map(p => p.id === paperId ? { ...p, [field]: value } : p)
        };
      }
      return s;
    });
    setEditingPyqSemester({ ...editingPyqSemester, subjects: updated });
  };

  const removePyqPaper = (subId: string, paperId: string) => {
    if (!editingPyqSemester) return;
    const updated = editingPyqSemester.subjects.map(s => {
      if (s.id === subId) {
        return { ...s, papers: s.papers.filter(p => p.id !== paperId) };
      }
      return s;
    });
    setEditingPyqSemester({ ...editingPyqSemester, subjects: updated });
  };

  const handlePyqFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, subId: string, paperId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        alert(`Uploading "${file.name}" to cloud storage. Please wait...`);
        const downloadURL = await uploadFileToAppwrite(file);
        
        updatePyqPaper(subId, paperId, 'url', downloadURL);
        alert(`File "${file.name}" uploaded successfully!`);
      } catch (error: any) {
        console.error("PYQ Upload failed", error);
        alert(`PYQ File upload failed: ${error.message}`);
      }
    }
  };


  const totalRevenue = purchases.filter((p: Purchase) => p.status === 'Approved').reduce((sum: number, p: Purchase) => sum + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Portal</h1>
          <p className="text-slate-500">Manage Platform, Courses, Coupons, and Payments</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-white dark:bg-slate-900 p-1 md:p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <LayoutDashboard size={18} /> Overview
           </button>
           <button 
             onClick={() => setActiveTab('users')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <Users size={18} /> Users
           </button>
           <button 
             onClick={() => setActiveTab('courses')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'courses' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <BookOpen size={18} /> Courses
           </button>
           <button 
              onClick={() => setActiveTab('pyqs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pyqs' ? 'bg-indigo-600 shadow-md text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <FileText size={18} /> PYQs
            </button>
            <button 
              onClick={() => setActiveTab('profile-logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile-logs' ? 'bg-indigo-600 shadow-md text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Activity size={18} /> Activity Logs
            </button>
            <button 
             onClick={() => setActiveTab('coupons')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'coupons' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <Tag size={18} /> Coupons
           </button>
           <button 
             onClick={() => setActiveTab('support')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <HelpCircle size={18} /> Support
             {supportMessages.filter(m => !m.reply).length > 0 && (
                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                   {supportMessages.filter(m => !m.reply).length}
                 </span>
             )}
           </button>
           
           <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
           
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-4 py-2 hover:bg-rose-100 text-rose-500 rounded-lg text-sm font-bold transition-colors"
           >
             <LogOut size={18} /> Logout
           </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard icon={<Users />} title="Total Users" value={users.length} color="text-indigo-500" bg="bg-indigo-100 dark:bg-indigo-900/40" />
            <StatCard icon={<ShoppingBag />} title="Total Orders" value={purchases.length} color="text-cyan-500" bg="bg-cyan-100 dark:bg-cyan-900/40" />
            <StatCard icon={<IndianRupee />} title="Approved Revenue" value={`₹${totalRevenue}`} color="text-emerald-500" bg="bg-emerald-100 dark:bg-emerald-900/40" />
          </div>



          <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Payment Attempts</h2>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Date & Txn ID</th>
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">User Details</th>
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Course / Item</th>
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Amount</th>
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Status</th>
                    <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No purchases recorded yet.</td>
                    </tr>
                  ) : (
                    purchases.map((p: Purchase) => (
                      <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 align-top">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{new Date(p.date).toLocaleString()}</div>
                          <div className="text-xs text-indigo-500 font-mono mt-1 font-bold">Txn: {p.transactionId || 'N/A'}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{p.userName}</div>
                          <div className="text-xs text-slate-500">{p.userEmail}</div>
                          <div className="text-xs text-slate-500 mt-1">{p.userMobile}</div>
                        </td>
                        <td className="p-4 align-top">
                           <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{p.courseName}</div>
                           <div className="text-xs text-slate-500 mt-1 capitalize">{p.itemType?.replace('-', ' ')}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">₹{p.amount}</div>
                        </td>
                        <td className="p-4 align-top">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              p.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                              p.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'
                           }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            {p.status !== 'Approved' && (
                              <button 
                                onClick={() => {
                                  if (p.status === 'Pending' || window.confirm('Are you sure you want to Approve this previously Rejected payment?')) {
                                    handleApprove(p.id);
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                title={p.status === 'Rejected' ? 'Restore access' : 'Approve payment'}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                            )}
                            {p.status !== 'Rejected' && (
                              <button 
                                onClick={() => {
                                  if (p.status === 'Pending' || window.confirm('Are you sure you want to Reject this previously Approved payment? This will revoke access.')) {
                                    handleReject(p.id);
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                title={p.status === 'Approved' ? 'Revoke access' : 'Reject payment'}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Registered Users</h2>
            
            {editingUser ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 relative">
                 <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <XCircle size={24} />
                 </button>
                 <h3 className="text-lg font-bold mb-4">Edit User</h3>
                 <form onSubmit={handleSaveUserEdit} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-bold mb-1">Name</label>
                      <input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Email</label>
                      <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Mobile Number</label>
                      <input type="text" value={editingUser.mobile || ''} onChange={e => setEditingUser({...editingUser, mobile: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div className="pt-2">
                       <button type="submit" className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all">Save Changes</button>
                    </div>
                 </form>
              </div>
            ) : null}

            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 font-semibold">User Details</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Joined At</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: User & { uid?: string, mobile?: string, createdAt?: string, role?: string }) => (
                    <tr key={u.uid || u.email} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {u.name}
                          {u.isBanned && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full uppercase tracking-wider">Banned</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">ID: {u.uid?.substring(0,8) || 'N/A'}...</div>
                      </td>
                      <td className="p-4 align-top">
                         <div className="text-sm text-slate-700 dark:text-slate-300">{u.email}</div>
                         <div className="text-sm font-medium mt-1">{u.mobile}</div>
                      </td>
                      <td className="p-4 align-top text-sm font-medium text-slate-600 dark:text-slate-400">
                         {u.createdAt}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setEditingUser(u)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-xs transition-colors"><Edit size={14} className="inline mr-1"/> Edit</button>
                           {u.isBanned ? (
                              <button onClick={async () => { await toggleBanStatus(u.uid || u.email, true); }} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg text-xs transition-colors">Unban</button>
                           ) : (
                              <button onClick={async () => { if(window.confirm('Ban this user? They will not be able to log in.')) { await toggleBanStatus(u.uid || u.email, false); } }} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-colors">Ban</button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          
          {editingSemester ? (
            <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl p-6 relative">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Course Package</h2>
                 <button onClick={() => setEditingSemester(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold">Cancel</button>
               </div>

               <form onSubmit={handleSaveSemester} className="space-y-6">
                 {/* Basic Info */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Semester/Package Name</label>
                      <input required type="text" value={editingSemester.name} onChange={e => setEditingSemester({...editingSemester, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Branch</label>
                      <select required value={editingSemester.branch} onChange={e => setEditingSemester({...editingSemester, branch: e.target.value as BranchType})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        {BRANCH_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Combo Pricing (₹)</label>
                      <input required type="number" min="0" value={editingSemester.comboPrice} onChange={e => setEditingSemester({...editingSemester, comboPrice: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Validity (e.g. 6 Months)</label>
                      <input required type="text" value={editingSemester.validity} onChange={e => setEditingSemester({...editingSemester, validity: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-bold mb-1">Display Title</label>
                      <input required type="text" value={editingSemester.title} onChange={e => setEditingSemester({...editingSemester, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-bold mb-1">Description</label>
                      <textarea required rows={3} value={editingSemester.description} onChange={e => setEditingSemester({...editingSemester, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                 </div>

                 {/* Subjects & PDFs */}
                 <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold">Subjects inside Package</h3>
                     <button type="button" onClick={addSubject} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-sm font-bold">
                       <Plus size={16} /> Add Subject
                     </button>
                   </div>

                   <div className="space-y-4">
                     {editingSemester.subjects.map((sub, idx) => (
                       <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between items-start mb-3">
                           <h4 className="font-bold">Subject {idx+1}</h4>
                           <button type="button" onClick={() => removeSubject(sub.id)} className="text-rose-500 hover:text-rose-600"><Trash2 size={16}/></button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="md:col-span-3 lg:col-span-1">
                              <label className="block text-xs font-bold mb-1">Subject Name</label>
                              <input required type="text" value={sub.name} onChange={e => updateSubject(sub.id, 'name', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                           </div>
                           <div className="md:col-span-1">
                              <label className="block text-xs font-bold mb-1">Notes Price (₹)</label>
                              <input required type="number" min="0" value={sub.notesPrice} onChange={e => updateSubject(sub.id, 'notesPrice', Number(e.target.value))} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                           </div>
                           <div className="md:col-span-1">
                              <label className="block text-xs font-bold mb-1">Quantum Price (₹)</label>
                              <input required type="number" min="0" value={sub.quantumPrice} onChange={e => updateSubject(sub.id, 'quantumPrice', Number(e.target.value))} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                           </div>
                           
                           {/* PDF Upload Fakers */}
                           <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="block text-xs font-bold mb-1">Notes PDF</label>
                                <div className="flex gap-2">
                                  <input readOnly type="text" value={sub.notesUrl} placeholder="e.g., /sample.pdf" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-500" />
                                  <label className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 px-3 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold flex-shrink-0">
                                     <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, sub.id, 'notesUrl')} />
                                     <Upload size={14} className="mr-1"/> Upload
                                  </label>
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-bold mb-1">Quantum PDF</label>
                                <div className="flex gap-2">
                                  <input readOnly type="text" value={sub.quantumUrl} placeholder="e.g., /sample.pdf" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-500" />
                                  <label className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 px-3 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold flex-shrink-0">
                                     <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, sub.id, 'quantumUrl')} />
                                     <Upload size={14} className="mr-1"/> Upload
                                 </label>
                                </div>
                             </div>
                           </div>

                         </div>
                       </div>
                     ))}
                     {editingSemester.subjects.length === 0 && (
                       <p className="text-center text-sm text-slate-500 py-4">No subjects added. Add a subject to sell PDFs.</p>
                     )}
                   </div>
                 </div>

                 <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-lg font-bold mb-4">Create Coupon for this Course</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-bold mb-1">Coupon Code</label>
                        <input type="text" placeholder="e.g. EXAM20" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">% Discount</label>
                        <input type="number" min="0" max="100" placeholder="0" value={newCoupon.discountPercent || ''} onChange={e => setNewCoupon({...newCoupon, discountPercent: Number(e.target.value), discountFlat: 0})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Flat Discount (₹)</label>
                        <input type="number" min="0" placeholder="0" value={newCoupon.discountFlat || ''} onChange={e => setNewCoupon({...newCoupon, discountFlat: Number(e.target.value), discountPercent: 0})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Applies To</label>
                        <select value={newCoupon.applicableItemId || ''} onChange={e => setNewCoupon({...newCoupon, applicableItemId: e.target.value || undefined})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                           <option value="">Any Course (Global)</option>
                           <option value={editingSemester.id}>Entire Combo ({editingSemester.name})</option>
                           {editingSemester.subjects.map((s: Subject) => (
                             <option key={s.id} value={s.id}>Subject: {s.name}</option>
                           ))}
                        </select>
                      </div>
                      <div className="md:col-span-4 mt-2">
                        <button type="button" onClick={handleCreateCoupon} disabled={!newCoupon.code || (!newCoupon.discountFlat && !newCoupon.discountPercent)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                          <Plus size={16} /> Create Coupon Now
                        </button>
                      </div>
                    </div>
                 </div>

                 <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30">
                      Save Course Limits
                    </button>
                 </div>
               </form>
            </div>
          ) : (
            <>
              {/* Course Listing */}
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Courses & Packages</h2>
                 </div>
                 <button onClick={createNewSemester} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all">
                   <Plus size={20} /> Add New Course Package
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {semesters.map((semester: Semester) => (
                  <div key={semester.id} className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{semester.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 rounded text-[10px] font-bold uppercase">{semester.branch}</span>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] font-bold uppercase">Valid: {semester.validity}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full text-xs font-bold">Combo: ₹{semester.comboPrice}</span>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{semester.title}</p>
                    
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 mb-6">
                       <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Subjects included:</p>
                       <p className="text-sm font-medium">{semester.subjects.length} Subjects</p>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => setEditingSemester(semester)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                         <Edit size={16} /> Edit
                       </button>
                       <button onClick={() => handleDeleteSemester(semester.id)} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
            </div>
            </>
          )}

        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Active Coupons</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon: Coupon) => (
                  <div key={coupon.id} className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag size={16} className="text-indigo-500" />
                        <span className="font-extrabold text-lg text-slate-900 dark:text-white">{coupon.code}</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        {coupon.discountPercent ? `${coupon.discountPercent}% OFF` : `₹${coupon.discountFlat} OFF`}
                      </div>
                      
                      <div className="inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded uppercase mt-1 font-bold">
                        {getItemNameForCoupon(coupon.applicableItemId)}
                      </div>
                      
                    </div>
                    <button onClick={() => handleRemoveCoupon(coupon.id)} className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {coupons.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-500">
                     No active coupons available. Create them from the Course Editor.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'support' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 p-6 max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">User Support Messages</h2>
            
            <div className="space-y-6">
              {supportMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p>No support messages found.</p>
                </div>
              ) : (
                supportMessages.map((msg: SupportMessage) => (
                  <div key={msg.id} className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-900/50">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-lg">{msg.userName}</div>
                        <div className="text-sm text-slate-500">{msg.userEmail}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(msg.timestamp).toLocaleString()}
                        {msg.reply ? (
                           <span className="ml-3 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">Replied</span>
                        ) : (
                           <span className="ml-3 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">Pending Reply</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                      {msg.message}
                    </div>

                    <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      {msg.reply ? (
                        <div>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Admin Reply:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{msg.reply}</p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <textarea 
                            rows={2} 
                            placeholder="Type a reply to the user..."
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={replyText[msg.id] || ''}
                            onChange={(e) => setReplyText({...replyText, [msg.id]: e.target.value})}
                          />
                          <button 
                            disabled={!replyText[msg.id]?.trim()}
                            onClick={async () => {
                              const res = await replyMessage(msg.id, replyText[msg.id]);
                              if (res.success) {
                                setReplyText({...replyText, [msg.id]: ''});
                              } else {
                                alert("Failed to send reply: " + res.message);
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold flex-shrink-0 self-end transition-all"
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pyqs' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {editingPyqSemester ? (
            <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl p-6 relative">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit PYQ Semester</h2>
                 <button onClick={() => setEditingPyqSemester(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold">Cancel</button>
               </div>

               <form onSubmit={handleSavePyqSemester} className="space-y-6">
                 {/* Basic Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Semester Name</label>
                      <input required type="text" value={editingPyqSemester.name} onChange={e => setEditingPyqSemester({...editingPyqSemester, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Branch</label>
                      <select required value={editingPyqSemester.branch} onChange={e => setEditingPyqSemester({...editingPyqSemester, branch: e.target.value as BranchType})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        {BRANCH_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 {/* Subjects & Papers */}
                 <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold">Subjects</h3>
                     <button type="button" onClick={addPyqSubject} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-sm font-bold">
                       <Plus size={16} /> Add Subject
                     </button>
                   </div>

                   <div className="space-y-6">
                     {editingPyqSemester.subjects.map((sub) => (
                       <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex-1 mr-4">
                              <label className="block text-xs font-bold mb-1">Subject Name</label>
                              <input required type="text" value={sub.name} onChange={e => updatePyqSubject(sub.id, e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold" />
                           </div>
                           <button type="button" onClick={() => removePyqSubject(sub.id)} className="text-rose-500 hover:text-rose-600 mt-5"><Trash2 size={16}/></button>
                         </div>
                         
                         {/* Papers inside Subject */}
                         <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 mt-4 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                               <h5 className="text-sm font-bold text-slate-600 dark:text-slate-400">Question Papers</h5>
                               <button type="button" onClick={() => addPyqPaper(sub.id)} className="flex items-center gap-1 px-2 py-1 bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 rounded text-xs font-bold">
                                 <Plus size={12} /> Add Paper
                               </button>
                            </div>
                            
                            {sub.papers.map(paper => (
                               <div key={paper.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div>
                                     <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Year</label>
                                     <input required type="text" value={paper.year} onChange={e => updatePyqPaper(sub.id, paper.id, 'year', e.target.value)} placeholder="e.g. 2025-2026" className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">PDF URL</label>
                                     <div className="flex gap-2">
                                        <input readOnly type="text" value={paper.url} placeholder="Upload PDF ->" className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500" />
                                        <label className="cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 px-3 flex items-center justify-center rounded text-xs font-bold flex-shrink-0">
                                           <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePyqFileUpload(e, sub.id, paper.id)} />
                                           <Upload size={12} className="mr-1"/> Upload
                                        </label>
                                     </div>
                                  </div>
                                  <button type="button" onClick={() => removePyqPaper(sub.id, paper.id)} className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded transition-colors mb-0.5"><Trash2 size={14}/></button>
                               </div>
                            ))}
                            {sub.papers.length === 0 && (
                              <p className="text-xs text-slate-500 py-2">No papers added to this subject.</p>
                            )}
                         </div>

                       </div>
                     ))}
                     {editingPyqSemester.subjects.length === 0 && (
                       <p className="text-center text-sm text-slate-500 py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">No subjects added. Click 'Add Subject' to start.</p>
                     )}
                   </div>
                 </div>

                 <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30">
                      Save PYQ Semester
                    </button>
                 </div>
               </form>
            </div>
          ) : (
            <>
              {/* PYQ Semester Listing */}
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Previous Year Questions</h2>
                 </div>
                 <button onClick={createNewPyqSemester} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all">
                   <Plus size={20} /> Add PYQ Semester
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pyqSemesters.map((semester: PYQSemester) => (
                  <div key={semester.id} className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{semester.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 rounded text-[10px] font-bold uppercase">{semester.branch}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 mb-6 flex-1">
                       <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Subjects included:</p>
                       <p className="text-sm font-medium">{semester.subjects.length} Subjects</p>
                       <p className="text-xs text-slate-500 mt-1">
                         Total Papers: {semester.subjects.reduce((sum, s) => sum + s.papers.length, 0)}
                       </p>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => setEditingPyqSemester(semester)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                         <Edit size={16} /> Edit
                       </button>
                       <button onClick={() => handleDeletePyqSemester(semester.id)} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
            </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'profile-logs' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="text-indigo-500" />
              Activity Logs
            </h2>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              {logsLoading ? (
                <div className="p-8 text-center text-slate-500">Loading logs from database...</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Date & Time</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">User Details</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Field Changed</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">Old Value</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-slate-800">New Value</th>
                     </tr>
                  </thead>
                  <tbody>
                    {!profileLogs || profileLogs.length === 0 ? (
                      <tr>
                         <td colSpan={5} className="p-8 text-center text-slate-500">No profile change logs found.</td>
                      </tr>
                    ) : (
                      profileLogs.map(log => (
                        <React.Fragment key={log.id}>
                          {(log.changes || []).map((change, idx) => (
                             <tr key={`${log.id}-${idx}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                {idx === 0 ? (
                                   <>
                                      <td className="p-4 align-top" rowSpan={(log.changes || []).length || 1}>
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                          {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                      </td>
                                      <td className="p-4 align-top" rowSpan={(log.changes || []).length || 1}>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                           {log.userName}
                                           {log.changedBy && (
                                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full uppercase tracking-wider font-bold">
                                                 By Admin
                                              </span>
                                           )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{log.userEmail}</div>
                                      </td>
                                   </>
                                ) : null}
                                <td className="p-4 align-top text-sm font-bold capitalize text-slate-700 dark:text-slate-300">
                                  {change?.field || 'Unknown'}
                                </td>
                                <td className="p-4 align-top text-sm text-rose-500 line-through">
                                  {change?.oldValue || <span className="text-slate-400 italic">none</span>}
                                </td>
                                <td className="p-4 align-top text-sm text-emerald-500 font-bold">
                                  {change?.newValue || <span className="text-slate-400 italic">none</span>}
                                </td>
                             </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ icon, title, value, color, bg }: { icon: React.ReactNode, title: string, value: string | number, color: string, bg: string }) => (
  <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 p-6 rounded-2xl flex items-center gap-6 border-t border-white/40 dark:border-slate-700/50 hover:-translate-y-1 transition-transform">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;

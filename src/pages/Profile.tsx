import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, updateUserPassword, verifyOldPassword } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (currentUser) {
       setProfileData({
         name: currentUser.name || '',
         email: currentUser.email || '',
         phone: currentUser.phoneNumber || '',
         oldPassword: '',
         newPassword: '',
         confirmPassword: '',
       });
    }
  }, [currentUser]);

  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setLoading(true);

    if (!profileData.name) {
      setProfileMsg({ text: 'Name is required.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const changes: { field: string, oldValue: any, newValue: any }[] = [];

      // Detect Name Change
      const currentName = currentUser?.name || '';
      if (profileData.name !== currentName) {
        changes.push({ field: 'name', oldValue: currentName, newValue: profileData.name });
      }

      // Detect Phone Change (Treating 'N/A' or null as empty string for comparison)
      const currentPhone = currentUser?.phoneNumber || '';
      if (profileData.phone !== currentPhone) {
        changes.push({ field: 'phoneNumber', oldValue: currentPhone, newValue: profileData.phone });
      }

      // 1. Update Firestore (Name, Phone Number)
      if (changes.length > 0) {
        await updateProfile({
          name: profileData.name,
          phoneNumber: profileData.phone
        });
      }

      // 2. Email updates are disabled/locked as per requirements.
      // 3. Update Firebase Auth Password if a new one is provided.
      if (profileData.newPassword) {
        if (profileData.newPassword.length < 6) {
          setProfileMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
          setLoading(false);
          return;
        }
        if (profileData.newPassword !== profileData.confirmPassword) {
          setProfileMsg({ text: 'New Password and Confirm Password do not match.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!profileData.oldPassword) {
          setProfileMsg({ text: 'Please enter your Old Password to set a new one.', type: 'error' });
          setLoading(false);
          return;
        }

        const isOldPasswordCorrect = await verifyOldPassword(profileData.oldPassword);
        if (!isOldPasswordCorrect) {
          setProfileMsg({ text: 'Old Password is incorrect.', type: 'error' });
          setLoading(false);
          return;
        }

        await updateUserPassword(profileData.newPassword);
        changes.push({ field: 'password', oldValue: '***', newValue: '***' });
      }

      // 4. Record Audit Log if there were any changes
      if (changes.length > 0) {
        await addDoc(collection(db, 'profileLogs'), {
          userId: currentUser?.uid,
          userEmail: currentUser?.email || 'Unknown',
          userName: profileData.name,
          timestamp: new Date().toISOString(),
          changes: changes
        });
      }

      if (changes.length === 0) {
         setProfileMsg({ text: 'No changes were made.', type: 'success' });
      } else {
         setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      }

      setProfileData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' })); 
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setProfileMsg({ text: 'For security, please log out and log in again to change your email or password.', type: 'error' });
      } else {
        setProfileMsg({ text: error.message || 'Failed to update profile.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.email) {
      setProfileMsg({ text: 'No email associated with this account.', type: 'error' });
      return;
    }
    setProfileMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setProfileMsg({ text: `✅ Password reset link sent to "${currentUser.email}". Please check your inbox.`, type: 'success' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/too-many-requests') {
        setProfileMsg({ text: 'Too many attempts. Please wait a few minutes.', type: 'error' });
      } else {
        setProfileMsg({ text: error.message || 'Failed to send reset email.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex justify-center md:justify-start items-center gap-3">
          <User className="text-indigo-500" size={32} />
          Account Settings
        </h1>
        <p className="text-slate-500 mt-2">Manage your personal information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Mail className="text-indigo-500" size={20} /> Personal Info
          </h2>

          {profileMsg.text && (
            <div className={`mb-4 p-3 text-sm rounded-lg flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
              {profileMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Phone Number</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={profileData.phone}
                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={profileData.name}
                onChange={e => setProfileData({...profileData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Email Address (Locked)</label>
              <input 
                type="email" 
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed outline-none transition-all"
                value={profileData.email}
                onChange={e => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Change Password</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Old Password</label>
                   <input 
                     type="password" 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={profileData.oldPassword}
                     onChange={e => setProfileData({...profileData, oldPassword: e.target.value})}
                     placeholder="Enter current password"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">New Password</label>
                   <input 
                     type="password" 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={profileData.newPassword}
                     onChange={e => setProfileData({...profileData, newPassword: e.target.value})}
                     placeholder="Enter new password"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Confirm New Password</label>
                   <input 
                     type="password" 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={profileData.confirmPassword}
                     onChange={e => setProfileData({...profileData, confirmPassword: e.target.value})}
                     placeholder="Confirm new password"
                   />
                 </div>

                 <div className="text-right">
                    <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-sm text-indigo-500 hover:text-indigo-600 font-semibold transition-colors disabled:opacity-50">
                      Forgot Password?
                    </button>
                 </div>
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-md active:scale-95">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

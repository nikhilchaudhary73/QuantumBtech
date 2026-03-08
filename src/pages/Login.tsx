import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogIn, Mail, Lock, UserPlus, Phone, KeyRound, ArrowLeft, User, Star } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot' | 'phone' | 'otp';

const inputClass = "w-full pl-10 pr-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Email / Password fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  const [recaptchaKey, setRecaptchaKey] = useState(0); // Increment to force fresh DOM node

  useEffect(() => {
    if (currentUser) navigate('/');
  }, [currentUser, navigate]);

  const clearMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  const goTo = (v: AuthView) => { clearMessages(); setView(v); };

  // ------------------------------------------------------------------
  // Shared: save/verify user in Firestore
  // ------------------------------------------------------------------
  const handleUserFirestore = async (user: any, displayName?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    // Prefer explicitly passed name, then Firebase displayName, then empty string
    const resolvedName = displayName || user.displayName || '';
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        name: resolvedName,
        photoURL: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
        createdAt: new Date().toISOString(),
        isBanned: false,
        role: 'student',
      });
    } else {
      const data = userSnap.data();
      // Update name in Firestore if it was blank and we now have one
      if (!data.name && resolvedName) {
        await setDoc(userRef, { name: resolvedName }, { merge: true });
      }
      if (data.isBanned) throw new Error('User is Ban. Support Team');
    }
  };

  // ------------------------------------------------------------------
  // Email Auth: Login
  // ------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const formattedEmail = email.trim().toLowerCase();

    if (formattedEmail === 'adminnikhil73@gmail.com' && password === 'Nikhil7310') {
      localStorage.setItem('btech_admin_auth', 'true');
      navigate('/admin');
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, formattedEmail, password);
      await handleUserFirestore(cred.user);
      // Use full page reload so onAuthStateChanged fires before the page renders
      window.location.href = '/';
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password.');
      } else {
        setErrorMsg(err.message || 'Sign in failed. Please try again.');
      }
      if (err.message && err.message.includes('User is Ban')) await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Email Auth: Sign Up
  // ------------------------------------------------------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    const formattedEmail = email.trim().toLowerCase();
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    try {
      // Manual check in Firestore to ensure no other user is using this email
      // This catches Google Sign-in accounts that might share the email.
      const q = query(collection(db, 'users'), where('email', '==', formattedEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setErrorMsg('An account with this email already exists.');
        setLoading(false);
        return;
      }
      
      const cred = await createUserWithEmailAndPassword(auth, formattedEmail, password);
      await updateProfile(cred.user, { displayName: name });
      await handleUserFirestore(cred.user, name);
      // Use full page reload so onAuthStateChanged fires before the page renders
      window.location.href = '/';
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists.');
      } else {
        setErrorMsg(err.message || 'Account creation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Forgot Password
  // ------------------------------------------------------------------
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail) { setErrorMsg('Please enter your email address first.'); return; }
    setLoading(true);
    try {
      // actionCodeSettings tells Firebase where to redirect after reset
      // The domain MUST be in Firebase Console → Authentication → Authorized Domains
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, formattedEmail, actionCodeSettings);
      setSuccessMsg(`✅ Password reset link sent to "${formattedEmail}". Please check your inbox and spam folder.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email address. Please check and try again.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/unauthorized-continue-uri' || err.code === 'auth/unauthorized-domain') {
        // Domain not authorized in Firebase Console
        setErrorMsg('Domain not authorized. Please add it in Firebase Console → Authentication → Authorized Domains.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setErrorMsg(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Phone Auth: Send OTP
  // ------------------------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Auto-format: if user typed 10 digits, prepend +91
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (/^\d{10}$/.test(formattedPhone)) {
      formattedPhone = '+91' + formattedPhone;
    } else if (/^0\d{10}$/.test(formattedPhone)) {
      formattedPhone = '+91' + formattedPhone.slice(1);
    } else if (/^\d{11}$/.test(formattedPhone) && formattedPhone.startsWith('91')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Validate E.164 format: starts with + followed by digits, 10-15 chars total
    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      setErrorMsg('Please enter a valid mobile number (e.g. 9876543210 or +919876543210).');
      return;
    }

    setPhone(formattedPhone); // update UI to show formatted number
    setLoading(true);
    try {
      // Clear previous verifier
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
      // Increment key → React unmounts old div, mounts a brand new clean div
      // Firebase then initialises into a fresh, never-touched DOM element
      setRecaptchaKey(k => k + 1);

      // Small delay to let React commit the new DOM node before Firebase accesses it
      await new Promise(res => setTimeout(res, 50));

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      goTo('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Make sure Phone Auth is enabled in Firebase Console.');
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Phone Auth: Verify OTP
  // ------------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!otp || otp.length < 4) { setErrorMsg('Please enter the OTP sent to your phone.'); return; }
    setLoading(true);
    try {
      const cred = await confirmationResult.confirm(otp);
      await handleUserFirestore(cred.user);
      navigate('/');
    } catch (err: any) {
      setErrorMsg('Invalid OTP. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Google Sign In
  // ------------------------------------------------------------------
  const handleGoogleLogin = async () => {
    clearMessages();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleUserFirestore(result.user);
      window.location.href = '/';
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google Sign-In failed.');
      }
      if (err.message && err.message.includes('User is Ban')) await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------
  const renderFeedback = () => (
    <>
      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm rounded-xl text-center font-semibold">{errorMsg}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm rounded-xl text-center font-semibold">{successMsg}</div>}
    </>
  );

  const GoogleButton = () => (
    <button onClick={handleGoogleLogin} disabled={loading} type="button"
      className="w-full mt-4 flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-sm transition-all active:scale-95 text-sm">
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  );

  const Divider = () => (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs text-slate-400 font-medium">OR</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );

  const BackBtn = ({ to }: { to: AuthView }) => (
    <button type="button" onClick={() => goTo(to)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium mb-4 transition-colors">
      <ArrowLeft size={16} /> Back
    </button>
  );

  // ------------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen flex w-full">
      {/* Recaptcha container — key forces fresh DOM node on every OTP attempt */}
      <div key={recaptchaKey} id="recaptcha-container" ref={recaptchaRef} className="hidden" />

      {/* Left Panel - Branding/Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 flex-col items-start justify-end p-16 xl:p-24 shadow-2xl z-10">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 opacity-90" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        
        {/* Content */}
        <div className="relative z-10 max-w-xl mb-12 animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <BookOpen size={36} className="text-cyan-400" />
            </div>
            <span className="font-extrabold text-4xl tracking-tight text-white">Quantum<span className="text-cyan-400"> Btech</span></span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 leading-[1.15]">
            Unleash your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">academic potential</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            The ultimate platform for B.Tech students. Access premium study materials, highly-rated Quantum PDFs, and branch-specific resources tailored just for you.
          </p>
        </div>
        
        {/* Testimonial */}
        <div className="relative z-10 w-full max-w-md p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-700 delay-300">
           <div className="flex gap-1 text-yellow-500 mb-3">
             <Star size={16} fill="currentColor" />
             <Star size={16} fill="currentColor" />
             <Star size={16} fill="currentColor" />
             <Star size={16} fill="currentColor" />
             <Star size={16} fill="currentColor" />
           </div>
           <p className="text-slate-200 font-medium font-serif italic mb-4">"The Quantum PDFs totally saved my life in the 3rd semester. Everything was spot on and incredibly well structured."</p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">AS</div>
              <div>
                <p className="text-white text-sm font-bold">Nikhil Chaudhary</p>
                <p className="text-slate-400 text-xs">CSE, 3rd Year</p>
              </div>
           </div>
        </div>
      </div>

      {/* Right Panel - Form (Centered) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Mobile background elements */}
        <div className="absolute lg:hidden top-1/4 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute lg:hidden bottom-0 right-0 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="p-4 bg-white dark:bg-slate-900 shadow-xl rounded-full border border-slate-100 dark:border-slate-800">
              <BookOpen size={32} className="text-indigo-600 dark:text-cyan-400" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none border border-white/40 lg:border-none dark:bg-slate-900/80 dark:lg:bg-transparent dark:border-slate-800/60 p-8 lg:p-0 rounded-3xl shadow-2xl lg:shadow-none animate-in fade-in zoom-in-95 duration-500">
            {/* ======================== LOGIN ======================== */}
            {view === 'login' && (
              <>
                <div className="text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Log in to access your dashboard and study materials.</p>
                </div>
                {renderFeedback()}
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Mail className="h-5 w-5" /></div>
                    <input required type="email" placeholder="Email address" className={inputClass + " pl-12 py-3.5"} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Lock className="h-5 w-5" /></div>
                    <input required type="password" placeholder="Password" minLength={6} className={inputClass + " pl-12 py-3.5"} value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="text-right -mt-2">
                    <button type="button" onClick={() => goTo('forgot')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">Forgot password?</button>
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-indigo-400 disabled:to-cyan-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    {loading ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
                  </button>
                </form>
                <Divider />
                <GoogleButton />
                <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => goTo('signup')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Sign Up for free</button>
                </p>
              </>
            )}

            {/* ======================== SIGN UP ======================== */}
            {view === 'signup' && (
              <>
                <div className="text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Join thousands of students topping their exams.</p>
                </div>
                {renderFeedback()}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><User className="h-5 w-5" /></div>
                    <input required type="text" placeholder="Full Name" className={inputClass + " pl-12"} value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Mail className="h-5 w-5" /></div>
                    <input required type="email" placeholder="Email Address" className={inputClass + " pl-12"} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Lock className="h-5 w-5" /></div>
                    <input required type="password" placeholder="Password (min 6 chars)" minLength={6} className={inputClass + " pl-12"} value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Lock className="h-5 w-5" /></div>
                    <input required type="password" placeholder="Confirm Password" minLength={6} className={inputClass + " pl-12"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-indigo-400 disabled:to-cyan-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2">
                    {loading ? 'Creating Account...' : <><UserPlus size={18} /> Create Account</>}
                  </button>
                </form>
                <Divider />
                <GoogleButton />
                <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Already a member?{' '}
                  <button type="button" onClick={() => goTo('login')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Sign In</button>
                </p>
              </>
            )}

            {/* ======================== FORGOT PASSWORD ======================== */}
            {view === 'forgot' && (
              <>
                <BackBtn to="login" />
                <div className="text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Enter your email and we'll send you instructions to reset your password.</p>
                </div>
                {renderFeedback()}
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Mail className="h-5 w-5" /></div>
                    <input required type="email" placeholder="Email address" className={inputClass + " pl-12 py-3.5"} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 disabled:from-indigo-400 disabled:to-cyan-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    {loading ? 'Sending Instructions...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            {/* ======================== PHONE: ENTER NUMBER ======================== */}
            {view === 'phone' && (
              <>
                <BackBtn to="login" />
                <div className="text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Phone Login</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">We'll send a secure one-time code to your mobile device.</p>
                </div>
                {renderFeedback()}
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Phone className="h-5 w-5" /></div>
                    <input required type="tel" placeholder="+91 XXXXX XXXXX" className={inputClass + " pl-12 py-3.5"} value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Include country code, e.g. <strong>+91</strong> for India.</p>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-70 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                    {loading ? 'Sending Code...' : <><Phone size={18} /> Send OTP Code</>}
                  </button>
                </form>
              </>
            )}

            {/* ======================== PHONE: ENTER OTP ======================== */}
            {view === 'otp' && (
              <>
                <BackBtn to="phone" />
                <div className="text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Verify Identity</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">We've sent a 6-digit code to <strong>{phone}</strong>.</p>
                </div>
                {renderFeedback()}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors"><KeyRound className="h-5 w-5" /></div>
                    <input required type="number" placeholder="Enter 6-digit OTP" className={inputClass + " pl-12 py-3.5 text-center tracking-[0.2em] font-bold"} value={otp} onChange={e => setOtp(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-70 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                    {loading ? 'Verifying...' : <><KeyRound size={18} /> Verify & Access</>}
                  </button>
                </form>
                <button type="button" onClick={() => goTo('phone')} className="w-full mt-4 text-sm text-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                  Didn't receive it? Resend Code
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, UserCircle, LogOut, Menu, X, Moon, Sun, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NavLinks = ({ 
  setIsOpen, user, handleLogout 
}: { 
  setIsOpen: (val: boolean) => void, 
  user: { name?: string; phoneNumber: string | null } | null, 
  handleLogout: () => void 
}) => (
  <>
    <Link to="/" className="hover:text-indigo-500 font-medium transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
    <Link to="/courses" className="hover:text-indigo-500 font-medium transition-colors" onClick={() => setIsOpen(false)}>Courses</Link>
    <Link to="/pyqs" className="hover:text-indigo-500 font-medium transition-colors" onClick={() => setIsOpen(false)}>PYQ's</Link>
    
    

    {user ? (
      <div className="flex items-center gap-4">
        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={() => setIsOpen(false)}>
          <UserCircle size={20} className="text-indigo-500" />
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.name || user.phoneNumber || 'Student'}</span>
        </Link>
        <Link to="/support" className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-medium transition-colors" onClick={() => setIsOpen(false)}>
          <HelpCircle size={18} /> Support
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    ) : (
      <Link 
        to="/login"
        onClick={() => setIsOpen(false)}
        className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-white px-5 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transform transition-all hover:scale-105 active:scale-95"
      >
        Login
      </Link>
    )}
  </>
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // 1. Check saved preference first
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // 2. Fall back to system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Apply theme class whenever isDark changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // NavLinks moved outside component

  return (
    <nav className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 sticky top-0 z-50 w-full mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen size={28} className="text-indigo-500" />
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400">Quantum Btech</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <NavLinks setIsOpen={setIsOpen} user={currentUser} handleLogout={handleLogout} />
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-700 dark:text-slate-300">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 absolute top-16 left-0 w-full flex flex-col items-center py-4 space-y-4 shadow-xl border-t border-white/20 dark:border-slate-800/50">
          <NavLinks setIsOpen={setIsOpen} user={currentUser} handleLogout={handleLogout} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;

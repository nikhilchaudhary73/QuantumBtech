import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Book, DownloadCloud, Star, Tag } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { getSemesters, type BranchType } from '../data/mockData';

const BRANCHES: BranchType[] = ['CSE', 'IT', 'ME', 'ECE', 'EE', 'CE'];

const Home: React.FC = () => {
  const [activeBranch, setActiveBranch] = useState<BranchType | 'All'>('All');
  const allSemesters = getSemesters();

  const filteredSemesters = allSemesters.filter(sem => {
    if (activeBranch === 'All') return true;
    return sem.branch === activeBranch || sem.branch === 'Common';
  });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-x opacity-20 dark:opacity-5 mix-blend-multiply" />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-6 ring-1 ring-indigo-500/20">
              India's #1 B.Tech Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              Best B.Tech Notes,<br /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400">Quantum & Materials</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Select your specific branch and instantly access Semester Wise Notes, Important Questions, and Quantum PDFs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/courses"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1"
              >
                Browse All Branches <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-950/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Quantum Btech?</h2>
            <p className="text-slate-600 dark:text-slate-400">Everything you need to top your university exams.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Book size={28} />} 
              title="Branch Specific" 
              desc="Resources organized exactly for CSE, IT, ME, EE, ECE and CE." 
            />
            <FeatureCard 
              icon={<Star size={28} />} 
              title="Quantum PDFs" 
              desc="Full access to premium, highly-rated Quantum series guides." 
            />
            <FeatureCard 
              icon={<DownloadCloud size={28} />} 
              title="Notes & Combos" 
              desc="Buy an entire semester pack or just the specific subject notes you need." 
            />
            <FeatureCard 
              icon={<Tag size={28} />} 
              title="Discounts & Coupons" 
              desc="Apply exclusive promo codes to get massive student discounts." 
            />
          </div>
        </div>
      </section>

      {/* Semesters Section */}
      <section className="py-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Select Your Branch</h2>
              <p className="text-slate-600 dark:text-slate-400">Viewing customized syllabus and materials.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveBranch('All')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  activeBranch === 'All'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                All Branches
              </button>
              {BRANCHES.map(branch => (
                <button
                  key={branch}
                  onClick={() => setActiveBranch(branch)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    activeBranch === branch
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-transparent dark:border-indigo-800 dark:hover:bg-indigo-900/40'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeBranch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredSemesters.length > 0 ? (
                filteredSemesters.map((sem, idx) => (
                  <CourseCard key={sem.id} semester={sem} index={idx} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400">
                    <Book size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Courses Found</h3>
                  <p className="text-slate-500">We are currently adding {activeBranch} materials to the platform.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-center">
            <Link to="/courses" className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold justify-center px-8 py-3 bg-white/70 backdrop-blur-md border border-indigo-200 dark:border-indigo-800 shadow-lg dark:bg-slate-900/70 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all">
              View All Course Packages <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-indigo-50 dark:bg-slate-900/50 rounded-[3rem] mx-4 sm:mx-8 mb-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl" />
        
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Trusted by thousands of techies.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              text="The Quantum PDFs saved my life in 3rd semester. Everything was spot on."
              author="Nikhil Chaudhary"
              role="CSE, 3rd Year"
            />
            <TestimonialCard 
              text="Best platform for B.Tech notes. The instant download works flawlessly."
              author="Priya Patel"
              role="ECE, 4th Year"
            />
            <TestimonialCard 
              text="No more xerox shop lines. Top tier exam focused materials."
              author="Rahul Verma"
              role="IT, 3rd Year"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 p-6 rounded-2xl flex flex-col items-center text-center border-t border-white/40 dark:border-slate-700/50"
  >
    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
  </motion.div>
);

const TestimonialCard = ({ text, author, role }: { text: string, author: string, role: string }) => (
  <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 p-8 rounded-2xl text-left">
    <div className="flex mb-4 text-yellow-500">
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
    </div>
    <p className="text-slate-700 dark:text-slate-300 italic mb-6">"{text}"</p>
    <div>
      <h4 className="font-bold text-slate-900 dark:text-white">{author}</h4>
      <p className="text-xs text-slate-500">{role}</p>
    </div>
  </div>
);

export default Home;

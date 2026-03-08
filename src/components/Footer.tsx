import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/70 backdrop-blur-md border-t border-slate-200 shadow-lg dark:bg-slate-900/70 dark:border-slate-800/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BookOpen size={28} className="text-indigo-500" />
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400">Quantum Btech</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              India's premium destination for B.Tech study materials, notes, and Quantum PDFs. Excellence guaranteed.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/" className="hover:text-indigo-500 transition-colors">Home</Link></li>
              <li><Link to="/courses" className="hover:text-indigo-500 transition-colors">All Courses</Link></li>

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-indigo-500" />
                Contact.officialnikhil@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                +91 7310690872
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Kondu Bulandshahr, Uttar Pradesh, India
              </li>
            </ul>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Payment Information</h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">We support all major UPI apps:</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded text-xs font-semibold shadow-sm text-indigo-600 border border-indigo-100 dark:border-indigo-900">PhonePe</span>
                <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded text-xs font-semibold shadow-sm text-cyan-600 border border-cyan-100 dark:border-cyan-900">Paytm</span>
                <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded text-xs font-semibold shadow-sm text-slate-600 border border-slate-100 dark:border-slate-900">GPay</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Quantum Btech Platform. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 mt-2 md:mt-0 font-medium">
            Designed by Nikhil Chaudhary | For B.Tech Excellence
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

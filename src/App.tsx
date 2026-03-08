import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Semester from './pages/Semester';
import CourseDetail from './pages/CourseDetail';
import PDFPreview from './pages/PDFPreview';
import PYQHome from './pages/PYQHome';
import PYQSemesterDetail from './pages/PYQSemesterDetail';
import PYQSubjectDetail from './pages/PYQSubjectDetail';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';

// Layout with Navbar and Footer
const MainLayout = () => (
  <div className="min-h-screen flex flex-col pt-4">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Layout without Navbar and Footer (for Admin Dashboard)
const AdminLayout = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Outlet />
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <Routes>
          {/* Public Routes with Navbar/Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/semester/:id" element={<Semester />} />
            <Route path="/subject/:semesterId/:subjectId" element={<CourseDetail />} />
            <Route path="/preview/:semesterId/:subjectId/:type" element={<PDFPreview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<HelpSupport />} />
            <Route path="/pyqs" element={<PYQHome />} />
            <Route path="/pyqs/semester/:semesterId" element={<PYQSemesterDetail />} />
            <Route path="/pyqs/subject/:semesterId/:subjectId" element={<PYQSubjectDetail />} />
          </Route>

          {/* Standalone Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes without main Navbar/Footer */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

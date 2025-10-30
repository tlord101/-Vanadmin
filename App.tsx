import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import CourseManager from './components/CourseManager';
import UserManager from './components/UserManager';
import NotificationPanel from './components/NotificationPanel';
import { db, auth } from './firebase';
import { getCountFromServer, collection } from 'firebase/firestore';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';

// Icon components for StatCards
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.084-1.28-.24-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.084-1.28.24-1.857m10 0l-2.88-2.88m-2.88 2.88l-2.88-2.88m2.88 2.88V12m-2.88-4.242A3.375 3.375 0 1112 3.375a3.375 3.375 0 010 6.75z" />
    </svg>
);
const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);
const ClipboardCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const APP_ID = 'vantutor-app';

const DashboardContent: React.FC = () => {
    const [userCount, setUserCount] = useState<number | null>(null);
    const [courseCount, setCourseCount] = useState<number | null>(null);
    const [leaderboardCount, setLeaderboardCount] = useState<number | null>(null);
    const [examCount, setExamCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchCounts = async () => {
        setError(null);
        try {
          const usersCol = collection(db, "users");
          const coursesCol = collection(db, "artifacts", APP_ID, "public", "data", "courses");
          const leaderboardCol = collection(db, "leaderboardOverall");
          const examsCol = collection(db, "exams");
  
          const [userSnapshot, courseSnapshot, leaderboardSnapshot, examSnapshot] = await Promise.all([
              getCountFromServer(usersCol),
              getCountFromServer(coursesCol),
              getCountFromServer(leaderboardCol),
              getCountFromServer(examsCol)
          ]);
  
          setUserCount(userSnapshot.data().count);
          setCourseCount(courseSnapshot.data().count);
          setLeaderboardCount(leaderboardSnapshot.data().count);
          setExamCount(examSnapshot.data().count);
  
        } catch (err) {
          console.error("Error fetching data from Firestore: ", err);
          setError("Failed to load dashboard statistics. Please try again later.");
        }
      };
  
      fetchCounts();
    }, []);

    return (
        <div className="animate-[fadeIn_0.5s]">
            <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {error && (
                    <div className="sm:col-span-2 lg:col-span-4 bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-xl text-center">
                        {error}
                    </div>
                )}
                <StatCard title="Total Users" value={userCount} icon={<UsersIcon />} color="bg-blue-500" />
                <StatCard title="Total Courses" value={courseCount} icon={<BookOpenIcon />} color="bg-green-500" />
                <StatCard title="Players on Leaderboard" value={leaderboardCount} icon={<StarIcon />} color="bg-yellow-500" />
                <StatCard title="Active Exams" value={examCount} icon={<ClipboardCheckIcon />} color="bg-red-500" />
            </div>
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <p className="text-gray-400">Activity feed will be displayed here in a future phase.</p>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-900">
        <Sidebar 
          activeItem={activeSection} 
          setActiveItem={setActiveSection} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <Header auth={auth} setIsSidebarOpen={setIsSidebarOpen} />
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <main className="md:pl-20 pt-20 transition-all duration-300 ease-in-out">
          <div className="p-4 md:p-8">
              {activeSection === 'Dashboard' && <DashboardContent />}
              {activeSection === 'Courses' && <CourseManager />}
              {activeSection === 'Users' && <UserManager />}
              {activeSection === 'Notifications' && <NotificationPanel />}
          </div>
        </main>
        <ToastContainer />
      </div>
    </ToastProvider>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import CourseManager from './components/CourseManager';
import UserManager from './components/UserManager';
import NotificationPanel from './components/NotificationPanel';
import { supabase } from './supabase';
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

const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: null as number | null,
    totalCourses: null as number | null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: usersCount, error: usersError } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;
        setStats(prev => ({ ...prev, totalUsers: usersCount }));

        const { count: coursesCount, error: coursesError } = await supabase.from('courses_data').select('*', { count: 'exact', head: true });
        if (coursesError) throw coursesError;
        setStats(prev => ({ ...prev, totalCourses: coursesCount }));
      } catch (error: any) {
        console.error("Error fetching initial stats:", error.message);
      }
    };
    fetchStats();
  }, []);

  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return (
          <div className="animate-[fadeIn_0.5s]">
            <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats.totalUsers} icon={<UsersIcon />} color="bg-blue-500" />
              <StatCard title="Total Courses" value={stats.totalCourses} icon={<BookOpenIcon />} color="bg-green-500" />
            </div>
          </div>
        );
      case 'Courses':
        return <CourseManager />;
      case 'Users':
        return <UserManager />;
      case 'Notifications':
        return <NotificationPanel />;
      case 'Exams':
        return <div className="text-center text-lg text-gray-400">Exam Manager Coming Soon...</div>;
      default:
        return <div>Select an item</div>;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex">
        <Sidebar 
          activeItem={activeItem} 
          setActiveItem={setActiveItem} 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
        <div className="flex-1 md:ml-20 transition-all duration-300 ease-in-out">
          <Header setIsSidebarOpen={setIsSidebarOpen} />
          <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
            {renderContent()}
          </main>
        </div>
      </div>
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;

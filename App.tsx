import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import CourseManager from './components/CourseManager';
import UserManager from './components/UserManager';
import NotificationPanel from './components/NotificationPanel';
import { db, auth } from './firebase';
import { getCountFromServer, collection, getDocs } from 'firebase/firestore';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import type { UserActivity } from './types';

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
const ActivityIcon = () => ( // New Icon
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ClockIcon = () => ( // New Icon
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);


const APP_ID = 'vantutor-app';

const DashboardContent: React.FC = () => {
    const [userCount, setUserCount] = useState<number | null>(null);
    const [courseCount, setCourseCount] = useState<number | null>(null);
    // New state for activity metrics
    const [activeUsers, setActiveUsers] = useState<number | null>(null);
    const [avgSession, setAvgSession] = useState<string | null>(null);
    const [topCountries, setTopCountries] = useState<{ country: string; count: number }[]>([]);

    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchCounts = async () => {
        setError(null);
        try {
          const usersCol = collection(db, "users");
          const coursesCol = collection(db, "artifacts", APP_ID, "public", "data", "courses");
          const activityCol = collection(db, "userActivity");
  
          const [userSnapshot, courseSnapshot, activitySnapshot] = await Promise.all([
              getCountFromServer(usersCol),
              getCountFromServer(coursesCol),
              getDocs(activityCol)
          ]);
  
          setUserCount(userSnapshot.data().count);
          setCourseCount(courseSnapshot.data().count);
          
          // --- Process Activity Data ---
          const allActivities: UserActivity[] = activitySnapshot.docs.map(doc => doc.data() as UserActivity);

          // 1. Calculate Active Users (24h)
          const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
          const activeUsersCount = allActivities.filter(activity => 
            activity.loginHistory && activity.loginHistory.some(login => login.timestamp > twentyFourHoursAgo)
          ).length;
          setActiveUsers(activeUsersCount);

          // 2. Calculate Avg Session Duration (7d)
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          let totalDuration = 0;
          let sessionCount = 0;
          allActivities.forEach(activity => {
              if (activity.sessionHistory) {
                  activity.sessionHistory.forEach(session => {
                      if (session.startTime > sevenDaysAgo) {
                          totalDuration += session.durationSeconds;
                          sessionCount++;
                      }
                  });
              }
          });
          const avgDurationMinutes = sessionCount > 0 ? (totalDuration / sessionCount / 60) : 0;
          setAvgSession(`${avgDurationMinutes.toFixed(1)} min`);

          // 3. Calculate Top 5 Login Countries
          const countryCounts: { [key: string]: number } = {};
          allActivities.forEach(activity => {
              if (activity.loginHistory) {
                  const uniqueCountriesForUser = new Set<string>();
                  activity.loginHistory.forEach(login => {
                      const country = login.location.split(', ').pop();
                      if (country) {
                          uniqueCountriesForUser.add(country);
                      }
                  });
                  uniqueCountriesForUser.forEach(country => {
                      countryCounts[country] = (countryCounts[country] || 0) + 1;
                  });
              }
          });
          const sortedCountries = Object.entries(countryCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([country, count]) => ({ country, count }));
          setTopCountries(sortedCountries);
  
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
                <StatCard title="Active Users (24h)" value={activeUsers} icon={<ActivityIcon />} color="bg-cyan-500" />
                <StatCard title="Avg. Session (7d)" value={avgSession} icon={<ClockIcon />} color="bg-purple-500" />
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Top Login Countries</h2>
                    {topCountries.length > 0 ? (
                        <ul className="space-y-3">
                            {topCountries.map(({ country, count }) => (
                                <li key={country} className="flex items-center justify-between text-gray-300">
                                    <span>{country}</span>
                                    <span className="font-bold text-white bg-black/20 px-2 py-1 rounded-md">{count.toLocaleString()} Users</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No country data available yet.</p>
                    )}
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Security Alert Feed</h2>
                    <p className="text-gray-400">Automated security alerts (e.g., impossible travel) will be displayed here in a future phase.</p>
                </div>
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

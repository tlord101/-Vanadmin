import React, { useState, useMemo } from 'react';
import type { User, Course, UserActivity, LoginEvent, SessionEvent } from '../types';
import Spinner from './Spinner';

interface EditUserModalProps {
  user: User;
  activity: UserActivity | null;
  activityLoading: boolean;
  courses: Course[];
  onClose: () => void;
  onSave: (userId: string, newName: string, newLevel: string) => Promise<void>;
  isLoading: boolean;
}

const parseUserAgent = (ua: string | undefined) => {
    let browser = 'Unknown';
    let os = 'Unknown';
    if (!ua) return 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    
    return `${browser} on ${os}`;
};

const LatestActivityCard: React.FC<{login: LoginEvent}> = ({ login }) => (
    <div className="bg-black/20 p-4 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Latest Activity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
                <p className="text-gray-400">Date & Time</p>
                <p className="text-white font-medium">{new Date(login.timestamp).toLocaleString()}</p>
            </div>
            <div>
                <p className="text-gray-400">IP Address</p>
                <p className="text-white font-medium">{login.ipAddress}</p>
            </div>
            <div>
                <p className="text-gray-400">Location</p>
                <p className="text-white font-medium">{login.location}</p>
            </div>
        </div>
    </div>
);

const LoginHistoryTable: React.FC<{history: LoginEvent[]}> = ({ history }) => {
    // History is already sorted by parent component.
    const knownCountries = new Set<string>();
    
    // Iterate backwards to establish a baseline of known countries
    for (let i = history.length - 1; i >= 0; i--) {
        const country = history[i].location.split(', ').pop();
        if (country) knownCountries.add(country);
    }
    
    const processedHistory = history.map((login) => {
        const country = login.location.split(', ').pop();
        let isNew = false;
        if (country && !knownCountries.has(country)) {
            isNew = true;
            knownCountries.add(country);
        }
        return { ...login, isNewCountry: isNew };
    });

    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-2">Login History</h3>
            <div className="bg-black/20 rounded-xl border border-white/10 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
                        <tr>
                            <th className="p-3">Date & Time</th>
                            <th className="p-3">IP Address</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Device/Browser</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedHistory.map((login, index) => {
                            const prevCountry = index < processedHistory.length - 1 ? processedHistory[index + 1].location.split(', ').pop() : null;
                            const currentCountry = login.location.split(', ').pop();
                            const isNewCountry = prevCountry && currentCountry !== prevCountry;

                            return (
                            <tr key={login.timestamp} className={`border-t border-white/10 ${isNewCountry ? 'bg-yellow-500/10' : ''}`}>
                                <td className="p-3">{new Date(login.timestamp).toLocaleString()}</td>
                                <td className="p-3 text-gray-300">{login.ipAddress}</td>
                                <td className="p-3 text-gray-300">{login.location} {isNewCountry && <span className="text-yellow-400 text-xs ml-1 font-semibold">(New Country)</span>}</td>
                                <td className="p-3 text-gray-300">{parseUserAgent(login.userAgent)}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

const SessionChart: React.FC<{history: SessionEvent[]}> = ({ history }) => {
    const chartData = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sessionsByDay: { [key: string]: number } = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            sessionsByDay[date.toISOString().split('T')[0]] = 0;
        }

        history.forEach(session => {
            if (session.startTime > thirtyDaysAgo.getTime()) {
                const dateKey = new Date(session.startTime).toISOString().split('T')[0];
                if (sessionsByDay[dateKey] !== undefined) {
                    sessionsByDay[dateKey] += session.durationSeconds;
                }
            }
        });
        
        const labels = Object.keys(sessionsByDay).sort();
        const data = labels.map(label => Math.round(sessionsByDay[label] / 60)); // in minutes
        const maxDuration = Math.max(...data, 1);

        return { labels, data, maxDuration };

    }, [history]);
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-2">Session Engagement (Last 30 Days)</h3>
            <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between items-end h-40 gap-1">
                    {chartData.data.map((value, index) => (
                        <div key={chartData.labels[index]} className="flex-1 flex flex-col items-center justify-end group">
                            <span className="text-xs text-white bg-indigo-500 px-1.5 py-0.5 rounded-md mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">{value} min</span>
                            <div 
                                className="w-full bg-indigo-500/30 rounded-t-md hover:bg-indigo-500 transition-colors"
                                style={{ height: `${(value / chartData.maxDuration) * 100}%` }}
                                title={`${chartData.labels[index]}: ${value} min`}
                            ></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>-30d</span>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
};


const EditUserModal: React.FC<EditUserModalProps> = ({ user, activity, activityLoading, courses, onClose, onSave, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [level, setLevel] = useState(user.level || '');

  const allLevels = useMemo(() => {
    const levels = courses.flatMap(c => c.levels);
    return ['', ...new Set(levels)].sort();
  }, [courses]);
  
  const sortedLoginHistory = useMemo(() => {
    if (!activity?.loginHistory) return [];
    return [...activity.loginHistory].sort((a, b) => b.timestamp - a.timestamp);
  }, [activity]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, displayName, level);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 transition-opacity duration-300 animate-[fadeIn_0.3s] p-4 pt-16 sm:pt-24 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-[zoomIn_0.3s_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">User Details: {user.displayName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <div className="border-b border-white/10 mb-6">
            <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-in-out outline-none focus:outline-none ${activeTab === 'details' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                User Details
            </button>
            <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-in-out outline-none focus:outline-none ${activeTab === 'activity' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                Activity & Security
            </button>
        </div>

        {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-4 animate-[fadeIn_0.3s]">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                    <select
                        id="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                    >
                        {allLevels.map(lvl => (
                            <option key={lvl} value={lvl}>{lvl || 'No Level'}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="font-semibold text-gray-300 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="font-semibold text-white px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center w-36"
                    >
                        {isLoading ? <Spinner /> : 'Save Changes'}
                    </button>
                </div>
            </form>
        )}
        
        {activeTab === 'activity' && (
            <div className="animate-[fadeIn_0.3s]">
                {activityLoading ? (
                    <div className="flex justify-center items-center h-48"><Spinner /></div>
                ) : activity ? (
                    <div className="space-y-6">
                        {sortedLoginHistory.length > 0 && <LatestActivityCard login={sortedLoginHistory[0]} />}
                        {sortedLoginHistory.length > 0 ? (
                            <LoginHistoryTable history={sortedLoginHistory} />
                        ) : <p className="text-gray-400 text-center">No login history found for this user.</p>}
                        
                        {activity.sessionHistory && activity.sessionHistory.length > 0 ? (
                            <SessionChart history={activity.sessionHistory} />
                        ) : <p className="text-gray-400 text-center">No session history found for this user.</p>}
                    </div>
                ) : <p className="text-gray-400 text-center h-48 flex items-center justify-center">No activity data available for this user.</p>
                }
            </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User, Notification } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

const NotificationPanel: React.FC = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'study_update' | 'exam_reminder' | 'leaderboard_change' | 'welcome'>('study_update');
    const [link, setLink] = useState('');
    const [target, setTarget] = useState<'all' | 'single'>('all');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    
    useEffect(() => {
        const fetchData = async () => {
            const { data: usersData, error: usersError } = await supabase.from('users').select('uid, display_name');
            if (usersError) console.error('Error fetching users:', usersError);
            else setUsers(usersData as User[]);

            const { data: notifsData, error: notifsError } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(10);
            if (notifsError) console.error('Error fetching notifications:', notifsError);
            else setRecentNotifications(notifsData as Notification[]);
        };

        fetchData();

        const notifsSubscription = supabase.channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
                setRecentNotifications(current => [payload.new as Notification, ...current].slice(0, 10));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notifsSubscription);
        };
    }, []);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.addToast('error', 'Validation Error', 'Title and message cannot be empty.');
            return;
        }
        if (target === 'single' && !selectedUserId) {
            toast.addToast('error', 'Validation Error', 'Please select a user to send the notification to.');
            return;
        }
        
        setIsLoading(true);
        try {
            const notificationPayload = {
                title,
                message,
                type,
                link: link.trim() || null,
            };

            if (target === 'single') {
                const { error } = await supabase.from('notifications').insert({
                    ...notificationPayload,
                    user_id: selectedUserId,
                });
                if (error) throw error;
            } else { // target === 'all'
                const { data: allUsers, error: usersError } = await supabase.from("users").select("uid");
                if (usersError) throw usersError;
                
                const notificationsToInsert = allUsers.map(user => ({
                    ...notificationPayload,
                    user_id: user.uid,
                }));

                const { error: bulkInsertError } = await supabase.from('notifications').insert(notificationsToInsert);
                if (bulkInsertError) throw bulkInsertError;
            }
            
            toast.addToast('success', 'Success', 'Notification sent successfully!');
            setTitle('');
            setMessage('');
            setType('study_update');
            setLink('');

        } catch (error: any) {
            console.error("Error sending notification:", error);
            toast.addToast('error', 'Error', `Failed to send notification: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-[fadeIn_0.5s]">
            <h1 className="text-3xl font-bold mb-8 text-white">Notification Broadcaster</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Notification Form */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-4">Compose Notification</h3>
                    <form onSubmit={handleSendNotification} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Notification Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                            required
                        />
                        <textarea
                            placeholder="Message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                            rows={4}
                            required
                        />
                         <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'study_update' | 'exam_reminder' | 'leaderboard_change' | 'welcome')}
                            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="study_update">Study Update</option>
                            <option value="exam_reminder">Exam Reminder</option>
                            <option value="leaderboard_change">Leaderboard Change</option>
                            <option value="welcome">Welcome</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Optional Link (e.g., /exams/exam123)"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value as 'all' | 'single')}
                                className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="all">All Users</option>
                                <option value="single">Single User</option>
                            </select>
                            {target === 'single' && (
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                    required
                                >
                                    <option value="" disabled>Select User</option>
                                    {users.map(user => (
                                        <option key={user.uid} value={user.uid}>{user.display_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                         <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full font-semibold text-white p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? <Spinner /> : 'Send Notification'}
                        </button>
                    </form>
                </div>

                {/* Recent Notifications List */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-4">Recent Notifications</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recentNotifications.length > 0 ? recentNotifications.map(notif => (
                            <div key={notif.id} className="bg-black/20 p-3 rounded-lg">
                                <p className="font-bold text-white">{notif.title}</p>
                                <p className="text-sm text-gray-300">{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Sent to: {users.find(u=>u.uid === notif.user_id)?.display_name || 'a user'} on {new Date(notif.timestamp).toLocaleString()}
                                </p>
                            </div>
                        )) : (
                            <p className="text-gray-400">No recent notifications found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
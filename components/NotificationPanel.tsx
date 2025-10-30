import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDocs, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
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
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });

        const notifsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
            const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setRecentNotifications(notifsData);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeNotifs();
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
            // Generate a unique ID for the notification upfront.
            const newNotifDocRef = doc(collection(db, "notifications"));
            const notifId = newNotifDocRef.id;
            
            const targetId = target === 'all' ? 'all' : selectedUserId;
            
            // Payload for the central /notifications collection (for admin history)
            const centralNotifData = {
                title,
                message,
                type,
                link: link.trim(),
                target: targetId,
                createdAt: new Date().toISOString()
            };

            // Write to the central log first
            await setDoc(newNotifDocRef, centralNotifData);

            // Payload for the user's subcollection (matches frontend type)
            const userNotifPayload = {
                id: notifId,
                type: type,
                title: title,
                message: message,
                timestamp: Date.now(),
                isRead: false,
                ...(link.trim() && { link: link.trim() }),
            };

            if (target === "all") {
                const usersSnap = await getDocs(collection(db, "users"));
                const batch = writeBatch(db);
                usersSnap.forEach(userDoc => {
                    const userNotifRef = doc(db, "users", userDoc.id, "notifications", notifId);
                    batch.set(userNotifRef, userNotifPayload);
                });
                await batch.commit();
            } else {
                const userNotifRef = doc(db, "users", selectedUserId, "notifications", notifId);
                await setDoc(userNotifRef, userNotifPayload);
            }
            
            toast.addToast('success', 'Success', 'Notification sent successfully!');
            setTitle('');
            setMessage('');
            setType('study_update');
            setLink('');

        } catch (error) {
            console.error("Error sending notification:", error);
            toast.addToast('error', 'Error', 'Failed to send notification.');
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
                                        <option key={user.id} value={user.id}>{user.displayName}</option>
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
                                    Sent to: {notif.target === 'all' ? 'All Users' : users.find(u=>u.id === notif.target)?.displayName || 'Single User'} on {new Date(notif.createdAt).toLocaleString()}
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
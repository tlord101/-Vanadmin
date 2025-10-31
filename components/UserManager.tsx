
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import type { User, Course } from '../types';
import EditUserModal from './EditUserModal';
import PromoteUsersModal from './PromoteUsersModal';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

const APP_ID = 'vantutor-app';

// --- Icon Component for Menu ---
const DotsVerticalIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);


const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();
    
    // State for action menu
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // State for modals
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);


    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, async (snapshot) => {
            try {
                const usersData = await Promise.all(snapshot.docs.map(async (userDoc) => {
                    const userData = userDoc.data() as Omit<User, 'id' | 'xp'>;
                    const leaderboardRef = doc(db, 'leaderboardOverall', userDoc.id);
                    const leaderboardSnap = await getDoc(leaderboardRef);
                    const xp = leaderboardSnap.exists() ? leaderboardSnap.data().xp : 0;
                    return {
                        id: userDoc.id,
                        ...userData,
                        xp: xp,
                    } as User;
                }));
                setUsers(usersData);
            } catch (err) {
                 console.error("Error processing users: ", err);
                 setError("Failed to process user data.");
            } finally {
                 setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching users: ", err);
            setError("Failed to load users.");
            setLoading(false);
        });
        
        const coursesQuery = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'courses'));
        const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(coursesData);
        }, (err) => {
            console.error("Error fetching courses for User Manager: ", err);
        });

        // Effect to close menu on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unsubscribeUsers();
            unsubscribeCourses();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setOpenMenuId(null); // Close menu after action
    };

    const handleSaveEdit = async (userId: string, newName: string, newLevel: string) => {
        if (!newName.trim()) {
            toast.addToast('error', 'Validation Error', 'Display Name cannot be empty.');
            return;
        }
        setIsSaving(true);
        try {
            const userRef = doc(db, "users", userId);
            const dataToUpdate: { displayName: string; level?: string } = {
                displayName: newName,
                level: newLevel,
            };
            await updateDoc(userRef, dataToUpdate);

            // Also update displayName in leaderboards
            const overallRef = doc(db, "leaderboardOverall", userId);
            if((await getDoc(overallRef)).exists()) await updateDoc(overallRef, { displayName: newName });
            const weeklyRef = doc(db, "leaderboardWeekly", userId);
            if((await getDoc(weeklyRef)).exists()) await updateDoc(weeklyRef, { displayName: newName });

            toast.addToast('success', 'Success', 'User updated successfully!');
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.addToast('error', 'Error', 'Failed to update user.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        setOpenMenuId(null);
        if (window.confirm("Are you sure you want to permanently delete this user? This will remove their authentication account and all database records. This action cannot be undone.")) {
            setDeletingUserId(userId);
            try {
                // Step 1: Securely delete the Firebase Auth user via a Cloud Function.
                const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
                await deleteAuthUser({ uid: userId });

                // Step 2: If Auth deletion succeeds, delete Firestore data in a single batch.
                const batch = writeBatch(db);

                const userRef = doc(db, "users", userId);
                batch.delete(userRef);

                const overallRef = doc(db, "leaderboardOverall", userId);
                if ((await getDoc(overallRef)).exists()) batch.delete(overallRef);

                const weeklyRef = doc(db, "leaderboardWeekly", userId);
                if ((await getDoc(weeklyRef)).exists()) batch.delete(weeklyRef);

                await batch.commit();

                toast.addToast('success', 'User Deleted', 'User account and all data permanently removed.');
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.addToast('error', 'Deletion Failed', 'Could not delete user. Check console for errors.');
            } finally {
                setDeletingUserId(null);
            }
        }
    };
    
    const handleBulkPromote = async (fromLevel: string, toLevel: string) => {
        const usersToPromote = users.filter(user => user.level === fromLevel);
    
        if (usersToPromote.length === 0) {
            toast.addToast('info', 'No Users Found', `No users found in level '${fromLevel}'.`);
            return;
        }
    
        if (!window.confirm(`Are you sure you want to promote ${usersToPromote.length} user(s) from ${fromLevel} to ${toLevel}?`)) {
            return;
        }
    
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            usersToPromote.forEach(user => {
                const userRef = doc(db, 'users', user.id);
                batch.update(userRef, { level: toLevel });
            });
            await batch.commit();
            toast.addToast('success', 'Success', `${usersToPromote.length} user(s) promoted successfully!`);
            setIsPromoteModalOpen(false);
        } catch (error) {
            console.error("Error promoting users:", error);
            toast.addToast('error', 'Error', 'Failed to promote users. Please check the console.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const formatDate = (timestamp: { seconds: number; nanoseconds: number; } | undefined) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };
    
    if (loading) return <div className="text-center text-lg text-gray-400 animate-pulse">Loading User Manager...</div>;
    if (error) return <div className="text-center text-lg text-red-500">{error}</div>;

    return (
        <div className="animate-[fadeIn_0.5s]">
            <h1 className="text-3xl font-bold mb-4 text-white">User Manager</h1>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-xl bg-white/10 text-white p-3 w-full sm:max-w-md border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                />
                <button
                    onClick={() => setIsPromoteModalOpen(true)}
                    className="font-semibold text-white px-5 py-3 w-full sm:w-auto rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 whitespace-nowrap"
                    disabled={courses.length === 0 || users.length === 0}
                >
                    Promote Users by Level
                </button>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4">Display Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Streak</th>
                                <th className="p-4">XP</th>
                                <th className="p-4">Date Joined</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                                    <td className="p-4">{user.displayName}</td>
                                    <td className="p-4 text-gray-400">{user.email}</td>
                                    <td className="p-4 text-gray-400">{user.level ?? 'N/A'}</td>
                                    <td className="p-4 text-gray-400 capitalize">{user.plan ?? 'N/A'}</td>
                                    <td className="p-4 text-gray-400">{user.currentStreak ?? 0}</td>
                                    <td className="p-4 font-bold">{user.xp?.toLocaleString() ?? 0}</td>
                                    <td className="p-4 text-gray-400">{formatDate(user.createdAt)}</td>
                                    <td className="p-4 h-[65px] text-center relative flex justify-center items-center" ref={openMenuId === user.id ? menuRef : null}>
                                        {deletingUserId === user.id ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                            <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Actions">
                                                <DotsVerticalIcon className="w-5 h-5" />
                                            </button>
                                            {openMenuId === user.id && (
                                                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 animate-[zoomIn_0.1s_ease-out] top-full">
                                                    <div className="py-1">
                                                        <button 
                                                            onClick={() => handleEditClick(user)} 
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 hover:text-white transition-colors"
                                                        >
                                                            Edit User
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)} 
                                                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                        >
                                                            Delete User
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    courses={courses}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveEdit}
                    isLoading={isSaving}
                />
            )}
            
            {isPromoteModalOpen && (
                <PromoteUsersModal
                    courses={courses}
                    onClose={() => setIsPromoteModalOpen(false)}
                    onPromote={handleBulkPromote}
                    isLoading={isSaving}
                />
            )}
        </div>
    );
};

export default UserManager;

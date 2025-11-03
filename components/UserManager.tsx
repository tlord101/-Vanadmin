import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import type { User, Course } from '../types';
import EditUserModal from './EditUserModal';
import PromoteUsersModal from './PromoteUsersModal';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

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


    const fetchAllData = async () => {
        setLoading(true);
        try {
            const { data: usersData, error: usersError } = await supabase.from('users').select('*');
            if (usersError) throw usersError;

            const usersWithXp = await Promise.all(usersData.map(async (user) => {
                const { data: leaderboardData } = await supabase
                    .from('leaderboard_overall')
                    .select('xp')
                    .eq('user_id', user.uid)
                    .single();
                return { ...user, xp: leaderboardData?.xp ?? 0 };
            }));

            setUsers(usersWithXp);

            const { data: coursesData, error: coursesError } = await supabase.from('courses_data').select('*');
            if (coursesError) throw coursesError;
            setCourses(coursesData);

        } catch (err: any) {
             console.error("Error fetching data: ", err);
             setError(`Failed to process data: ${err.message}`);
        } finally {
             setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();

        // Effect to close menu on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        const userSubscription = supabase.channel('public:users')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchAllData)
          .subscribe();

        return () => {
            supabase.removeChannel(userSubscription);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEditClick = (user: User) => {
        setOpenMenuId(null); // Close menu after action
        setEditingUser(user);
    };

    const handleSaveEdit = async (userId: string, newName: string, newLevel: string) => {
        if (!newName.trim()) {
            toast.addToast('error', 'Validation Error', 'Display Name cannot be empty.');
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase.from("users").update({
                display_name: newName,
                level: newLevel,
            }).eq('uid', userId);
            if (error) throw error;
            
            // Also update displayName in leaderboards
            await supabase.from("leaderboard_overall").update({ display_name: newName }).eq('user_id', userId);
            await supabase.from("leaderboard_weekly").update({ display_name: newName }).eq('user_id', userId);

            toast.addToast('success', 'Success', 'User updated successfully!');
            setEditingUser(null);
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.addToast('error', 'Error', `Failed to update user: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        setOpenMenuId(null); // Close menu after action
        if (window.confirm("Are you sure you want to delete this user and all their data? This action cannot be undone.")) {
            setDeletingUserId(userId);
            try {
                // This would be a single call to a Supabase Function (RPC) in production
                // to ensure atomicity. For here, we do it sequentially.
                await supabase.from("leaderboard_overall").delete().eq('user_id', userId);
                await supabase.from("leaderboard_weekly").delete().eq('user_id', userId);
                const { error } = await supabase.from("users").delete().eq('uid', userId);
                if (error) throw error;
                
                toast.addToast('success', 'Success', 'User data deleted successfully.');
            } catch (error: any) {
                console.error("Error deleting user:", error);
                toast.addToast('error', 'Error', `Failed to delete user data: ${error.message}`);
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
            const { error } = await supabase
                .from('users')
                .update({ level: toLevel })
                .eq('level', fromLevel);

            if (error) throw error;

            toast.addToast('success', 'Success', `${usersToPromote.length} user(s) promoted successfully!`);
            setIsPromoteModalOpen(false);
        } catch (error: any) {
            console.error("Error promoting users:", error);
            toast.addToast('error', 'Error', `Failed to promote users: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            (user.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const getUserStatus = (lastActivity: string | undefined) => {
        if (!lastActivity) {
            return { status: 'Inactive', labelColor: 'bg-gray-500/30 text-gray-300', lastSeen: 'Never' };
        }
        const lastActivityDate = new Date(parseInt(lastActivity, 10)); // Assuming bigint is a timestamp string
        const now = new Date();
        const diffInMs = now.getTime() - lastActivityDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays <= 7) {
            return { status: 'Active', labelColor: 'bg-green-500/30 text-green-300', lastSeen: lastActivityDate.toLocaleDateString() };
        }
        return { status: 'Inactive', labelColor: 'bg-gray-500/30 text-gray-300', lastSeen: lastActivityDate.toLocaleDateString() };
    };
    
    if (loading) return <div className="text-center text-lg text-gray-400 animate-pulse">Loading User Manager...</div>;
    if (error) return <div className="text-center text-lg text-red-500">{error}</div>;

    return (
        <div className="animate-[fadeIn_0.5s]">
            <h1 className="text-3xl font-bold mb-4 text-white">User Manager</h1>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name..."
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
                    <table className="w-full text-left min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4">Display Name</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Streak</th>
                                <th className="p-4">XP</th>
                                <th className="p-4">Last Activity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => {
                                const { status, labelColor, lastSeen } = getUserStatus(user.last_activity_date);
                                return (
                                <tr key={user.uid} className="border-b border-white/20 last:border-b-0 hover:bg-white/5 transition-colors">
                                    <td className="p-4">{user.display_name}</td>
                                    <td className="p-4 text-gray-400">{user.level ?? 'N/A'}</td>
                                    <td className="p-4 text-gray-400">{user.current_streak ?? 0}</td>
                                    <td className="p-4 font-bold">{user.xp?.toLocaleString() ?? 0}</td>
                                    <td className="p-4 text-gray-400">{lastSeen}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${labelColor}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="p-4 h-[65px] text-center relative flex justify-center items-center" ref={openMenuId === user.uid ? menuRef : null}>
                                        {deletingUserId === user.uid ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                            <button onClick={() => setOpenMenuId(openMenuId === user.uid ? null : user.uid)} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Actions">
                                                <DotsVerticalIcon className="w-5 h-5" />
                                            </button>
                                            {openMenuId === user.uid && (
                                                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 animate-[zoomIn_0.1s_ease-out] top-full">
                                                    <div className="py-1">
                                                        <button 
                                                            onClick={() => handleEditClick(user)} 
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 hover:text-white transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.uid)} 
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
                            )})}
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

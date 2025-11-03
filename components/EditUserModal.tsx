import React, { useState, useMemo } from 'react';
import type { User, Course } from '../types';
import Spinner from './Spinner';

interface EditUserModalProps {
  user: User;
  courses: Course[];
  onClose: () => void;
  onSave: (userId: string, newName: string, newLevel: string) => Promise<void>;
  isLoading: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, courses, onClose, onSave, isLoading }) => {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [level, setLevel] = useState(user.level || '');

  const allLevels = useMemo(() => {
    const levels = courses.flatMap(c => c.levels);
    return ['', ...new Set(levels)].sort();
  }, [courses]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.uid, displayName, level);
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
          <h2 className="text-2xl font-bold text-white">Edit User: {user.display_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
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
      </div>
    </div>
  );
};

export default EditUserModal;

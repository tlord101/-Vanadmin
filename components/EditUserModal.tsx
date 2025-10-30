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
  const [editedName, setEditedName] = useState(user.displayName);
  const [editedLevel, setEditedLevel] = useState(user.level ?? '');

  const availableLevels = useMemo(() => {
    const userCourse = courses.find(c => c.id === user.courseId);
    return userCourse?.levels ?? [];
  }, [courses, user.courseId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, editedName, editedLevel);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 animate-[fadeIn_0.3s]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-[zoomIn_0.3s_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-2xl font-bold text-white">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <p className="rounded-xl bg-black/20 text-gray-400 p-3 w-full">{user.email}</p>
          </div>
          
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">Level</label>
            <select
              id="level"
              value={editedLevel}
              onChange={(e) => setEditedLevel(e.target.value)}
              disabled={availableLevels.length === 0}
              className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{availableLevels.length > 0 ? "Select Level" : "No levels in course"}</option>
              {availableLevels.map(level => (
                <option key={level} value={level}>{level}</option>
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
import React, { useState, useMemo } from 'react';
import type { Course } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface PromoteUsersModalProps {
  courses: Course[];
  onClose: () => void;
  onPromote: (fromLevel: string, toLevel: string) => Promise<void>;
  isLoading: boolean;
}

const PromoteUsersModal: React.FC<PromoteUsersModalProps> = ({ courses, onClose, onPromote, isLoading }) => {
  const [fromLevel, setFromLevel] = useState('');
  const [toLevel, setToLevel] = useState('');
  const toast = useToast();

  const allLevels = useMemo(() => {
    const levels = courses.flatMap(c => c.levels);
    return [...new Set(levels)].sort(); // Get unique, sorted levels
  }, [courses]);

  const availableToLevels = useMemo(() => {
    return allLevels.filter(l => l !== fromLevel);
  }, [allLevels, fromLevel]);

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLevel || !toLevel) {
      toast.addToast('error', 'Validation Error', "Please select both a 'from' and 'to' level.");
      return;
    }
    onPromote(fromLevel, toLevel);
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
          <h2 id="modal-title" className="text-2xl font-bold text-white">Promote Users by Level</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label htmlFor="fromLevel" className="block text-sm font-medium text-gray-300 mb-1">Promote users FROM level:</label>
            <select
              id="fromLevel"
              value={fromLevel}
              onChange={(e) => {
                setFromLevel(e.target.value);
                // Reset 'to' level if it's the same as the new 'from' level
                if (e.target.value === toLevel) {
                  setToLevel('');
                }
              }}
              className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
              required
            >
              <option value="" disabled>Select a level</option>
              {allLevels.map(level => (
                <option key={`from-${level}`} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="toLevel" className="block text-sm font-medium text-gray-300 mb-1">Promote users TO level:</label>
            <select
              id="toLevel"
              value={toLevel}
              onChange={(e) => setToLevel(e.target.value)}
              disabled={!fromLevel || availableToLevels.length === 0}
              className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="" disabled>Select target level</option>
              {availableToLevels.map(level => (
                <option key={`to-${level}`} value={level}>{level}</option>
              ))}
            </select>
            {!fromLevel && <p className="text-xs text-gray-400 mt-1">Select a 'from' level first.</p>}
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="font-semibold text-gray-300 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !fromLevel || !toLevel}
              className="font-semibold text-white px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center w-36"
            >
              {isLoading ? <Spinner /> : 'Promote Users'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoteUsersModal;
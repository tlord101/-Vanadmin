import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import type { Course } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface LevelFormProps {
  courses: Course[];
}

const APP_ID = 'vantutor-app';

const LevelForm: React.FC<LevelFormProps> = ({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [levelName, setLevelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !levelName.trim()) {
      toast.addToast('error', 'Validation Error', 'Please select a course and enter a level name.');
      return;
    }
    setIsLoading(true);
    try {
      const courseRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', selectedCourse);
      await updateDoc(courseRef, {
        levels: arrayUnion(levelName.trim())
      });
      toast.addToast('success', 'Success', 'Level added successfully!');
      setLevelName('');
    } catch (error) {
      console.error('Error adding level:', error);
      toast.addToast('error', 'Error', 'Failed to add level. See console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">2. Add New Level to Course</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          required
        >
          <option value="" disabled>Select a Course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseName}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New Level Name (e.g., 100L)"
          value={levelName}
          onChange={(e) => setLevelName(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          required
        />
        <button
          type="submit"
          disabled={isLoading || courses.length === 0}
          className="w-full font-semibold text-white p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <Spinner /> : 'Add Level'}
        </button>
      </form>
    </div>
  );
};

export default LevelForm;
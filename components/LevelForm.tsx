import React, { useState } from 'react';
import { supabase } from '../supabase';
import type { Course } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface LevelFormProps {
  courses: Course[];
}

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
      // 1. Fetch the current levels for the selected course
      const { data, error: fetchError } = await supabase
        .from('courses_data')
        .select('levels')
        .eq('id', selectedCourse)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. Append the new level (avoiding duplicates)
      const currentLevels = data?.levels || [];
      const newLevel = levelName.trim();
      if (currentLevels.includes(newLevel)) {
        toast.addToast('info', 'Duplicate', 'This level already exists for the course.');
        setIsLoading(false);
        return;
      }
      const updatedLevels = [...currentLevels, newLevel];

      // 3. Update the course with the new levels array
      const { error: updateError } = await supabase
        .from('courses_data')
        .update({ levels: updatedLevels })
        .eq('id', selectedCourse);
      
      if (updateError) throw updateError;
      
      toast.addToast('success', 'Success', 'Level added successfully!');
      setLevelName('');
    } catch (error: any) {
      console.error('Error adding level:', error);
      toast.addToast('error', 'Error', `Failed to add level: ${error.message}`);
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
              {course.course_name}
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

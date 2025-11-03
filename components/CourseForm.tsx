import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

const CourseForm: React.FC = () => {
  const [courseName, setCourseName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      toast.addToast('error', 'Validation Error', 'Course Name cannot be empty.');
      return;
    }
    setIsLoading(true);
    try {
      const course_id = `course_${Date.now()}`;
      const { error } = await supabase.from('courses_data').insert({
        id: course_id,
        course_name: courseName,
        levels: [],
        subject_list: [],
      });

      if (error) throw error;

      toast.addToast('success', 'Success', 'Course created successfully!');
      setCourseName('');
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.addToast('error', 'Error', `Failed to create course: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">1. Add New Course</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Course Name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full font-semibold text-white p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <Spinner /> : 'Create Course'}
        </button>
      </form>
    </div>
  );
};

export default CourseForm;

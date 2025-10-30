import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

const APP_ID = 'vantutor-app'; // As specified in the prompt

const CourseForm: React.FC = () => {
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
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
      const courseId = `course_${Date.now()}`;
      const courseRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', courseId);
      await setDoc(courseRef, {
        courseId,
        courseName,
        description,
        levels: [],
        subjectList: [],
      });
      toast.addToast('success', 'Success', 'Course created successfully!');
      setCourseName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.addToast('error', 'Error', 'Failed to create course. See console for details.');
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
        <textarea
          placeholder="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          rows={3}
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
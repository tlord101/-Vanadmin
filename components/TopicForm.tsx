import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Course, Subject } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface TopicFormProps {
  courses: Course[];
}

const APP_ID = 'vantutor-app';

const TopicForm: React.FC<TopicFormProps> = ({ courses }) => {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      setSubjects(course?.subjectList || []);
      setSelectedSubjectId('');
    } else {
      setSubjects([]);
    }
  }, [selectedCourseId, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedSubjectId || !topicName.trim()) {
      toast.addToast('error', 'Validation Error', 'Please select a course, subject, and enter a topic name.');
      return;
    }
    setIsLoading(true);
    try {
      const topicId = `topic_${Date.now()}`;
      const topicRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', selectedCourseId, 'subjects', selectedSubjectId, 'topics', topicId);
      await setDoc(topicRef, {
        topicName,
      });

      toast.addToast('success', 'Success', 'Topic added successfully!');
      setTopicName('');

    } catch (error)
    {
      console.error('Error adding topic:', error);
      toast.addToast('error', 'Error', 'Failed to add topic. See console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">3. Add Topic to Subject</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
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
        
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          disabled={!selectedCourseId}
          required
        >
          <option value="" disabled>Select a Subject</option>
          {subjects.map((subject) => (
            <option key={subject.subjectId} value={subject.subjectId}>
              {subject.subjectName}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="New Topic Name"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
          required
        />
        <button
          type="submit"
          disabled={isLoading || courses.length === 0}
          className="w-full font-semibold text-white p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <Spinner /> : 'Add Topic'}
        </button>
      </form>
    </div>
  );
};

export default TopicForm;
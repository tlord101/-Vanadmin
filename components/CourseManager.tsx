import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CourseForm from './CourseForm';
import LevelForm from './LevelForm';
import AddSubjectModal from './AddSubjectModal';
import EditSubjectModal from './EditSubjectModal';
import type { Course, Subject, Topic } from '../types';
import { useToast } from '../contexts/ToastContext';

const APP_ID = 'vantutor-app';

// --- Icon Component ---
const ChevronDownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);


const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('courses');
  const toast = useToast();
  
  // State for new accordion view
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [editingSubjectState, setEditingSubjectState] = useState<{ course: Course, subject: Subject } | null>(null);
  const [contextForAdd, setContextForAdd] = useState<{ courseId: string, levelName: string } | null>(null);


  useEffect(() => {
    const coursesQuery = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'courses'));
    
    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      setLoading(true);
      setError(null);
      try {
        const coursesData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                courseId: data.courseId,
                courseName: data.courseName,
                description: data.description,
                levels: data.levels || [],
                subjectList: data.subjectList || [],
            } as Course;
        });

        setCourses(coursesData);
      } catch (err) {
        console.error("Error fetching courses: ", err);
        setError("Failed to load courses. Please check the console for more details.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching courses: ", err);
      setError("Failed to load courses. Please check the console for more details.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- CRUD operations for subjects and topics ---
  const handleSaveSubjectChanges = async (subjectId: string, newName: string, newSemester: 'first' | 'second', topicsToAdd: string[], topicsToDelete: string[]) => {
    if (!editingSubjectState) return;
    setLoading(true);
    try {
        const { course } = editingSubjectState;
        const newTopics: Topic[] = topicsToAdd
            .map(t => t.trim())
            .filter(t => t)
            .map(topicName => ({
                topicId: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                topicName
            }));

        const newSubjectList = course.subjectList.map(s => {
            if (s.subjectId === subjectId) {
                const remainingTopics = s.topics.filter(t => !topicsToDelete.includes(t.topicId));
                return {
                    ...s,
                    subjectName: newName,
                    semester: newSemester,
                    topics: [...remainingTopics, ...newTopics]
                };
            }
            return s;
        });

        const courseRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', course.id);
        await updateDoc(courseRef, { subjectList: newSubjectList });

        toast.addToast('success', 'Success', 'Subject updated successfully!');
        setEditingSubjectState(null);
    } catch (err) {
        console.error("Error updating subject:", err);
        toast.addToast('error', 'Error', 'Failed to update subject.');
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteSubject = async (subjectId: string) => {
    if (!editingSubjectState || !window.confirm("Are you sure you want to delete this subject and all its topics? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const { course } = editingSubjectState;
      const newSubjectList = course.subjectList.filter(s => s.subjectId !== subjectId);
      const courseRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', course.id);
      await updateDoc(courseRef, { subjectList: newSubjectList });
      toast.addToast('success', 'Success', 'Subject deleted successfully!');
      setEditingSubjectState(null);
    } catch (err) {
        console.error("Error deleting subject:", err);
        toast.addToast('error', 'Error', 'Failed to delete subject.');
    } finally {
        setLoading(false);
    }
  };
  
  const handleOpenAddModal = (courseId: string, levelName: string) => {
    setContextForAdd({ courseId, levelName });
  };

  if (loading && courses.length === 0) {
    return <div className="text-center text-lg text-gray-400 animate-pulse">Loading Course Manager...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-500">{error}</div>;
  }

  const courseLevelPairs = courses.flatMap(course => 
    course.levels.length > 0
        ? course.levels.map(level => ({ course, level }))
        : [{ course, level: null }] // Handle courses with no levels
  );

  return (
    <div className="animate-[fadeIn_0.5s]">
      <h1 className="text-3xl font-bold mb-8 text-white">Course Manager</h1>
      
      <div className="flex border-b border-white/10 mb-6">
          <button onClick={() => setActiveTab('courses')} className={`px-6 py-3 font-semibold transition-colors duration-200 ease-in-out outline-none focus:outline-none ${activeTab === 'courses' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
              Manage Courses & Levels
          </button>
          <button onClick={() => setActiveTab('subjects')} className={`px-6 py-3 font-semibold transition-colors duration-200 ease-in-out outline-none focus:outline-none ${activeTab === 'subjects' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
              Manage Subjects & Topics
          </button>
      </div>

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-[fadeIn_0.5s]">
          <div className="space-y-8">
            <CourseForm />
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">All Courses</h3>
                {courses.length > 0 ? (
                    <ul className="space-y-2">
                        {courses.map(course => (
                            <li key={course.id} className="bg-black/20 p-3 rounded-lg text-white">
                                {course.courseName}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-400">No courses available.</p>}
            </div>
          </div>
          <LevelForm courses={courses} />
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-3 animate-[fadeIn_0.5s]">
          {courseLevelPairs.map(({ course, level }) => {
            if (!level) {
              return (
                <div key={course.id} className="bg-black/20 rounded-lg border border-white/10 p-4 text-gray-400">
                  <span className="font-semibold text-white">{course.courseName}</span> - Add levels to this course to manage subjects.
                </div>
              );
            }
            
            const itemKey = `${course.id}-${level}`;
            const isExpanded = expandedItemKey === itemKey;
            const subjectsForLevel = course.subjectList.filter(s => s.level === level);

            return (
              <div key={itemKey} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button 
                  onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                  className="flex justify-between items-center w-full text-left p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg font-semibold text-white">{course.courseName} - {level}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="p-4 border-t border-white/10 animate-[fadeIn_0.5s]">
                    {subjectsForLevel.length > 0 ? (
                      <div className="space-y-2">
                        {subjectsForLevel.map(subject => (
                          <button
                            key={subject.subjectId}
                            onClick={() => setEditingSubjectState({ course, subject })}
                            className="w-full bg-black/30 text-white p-3 rounded-lg text-left hover:bg-indigo-500/30 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{subject.subjectName}</span>
                                {subject.semester && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subject.semester === 'first' ? 'bg-blue-500/30 text-blue-300' : 'bg-green-500/30 text-green-300'}`}>
                                        {subject.semester === 'first' ? '1st Sem' : '2nd Sem'}
                                    </span>
                                )}
                            </div>
                            <span className="block text-xs text-gray-400 mt-1">{subject.topics.length} topics</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No subjects found for this level.</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                      <button 
                        onClick={() => handleOpenAddModal(course.id, level)}
                        className="font-semibold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform"
                      >
                        + Add New Subject to {level}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {editingSubjectState && (
        <EditSubjectModal 
            onClose={() => setEditingSubjectState(null)}
            course={editingSubjectState.course}
            subject={editingSubjectState.subject}
            onSave={handleSaveSubjectChanges}
            onDelete={handleDeleteSubject}
        />
      )}

      {contextForAdd && (
        <AddSubjectModal
            onClose={() => setContextForAdd(null)}
            courseId={contextForAdd.courseId}
            levelName={contextForAdd.levelName}
        />
      )}
    </div>
  );
};

export default CourseManager;
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import CourseForm from './CourseForm';
import LevelForm from './LevelForm';
import AddSubjectModal from './AddSubjectModal';
import EditSubjectModal from './EditSubjectModal';
import type { Course, Subject } from '../types';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

// --- Icon Components ---
const ChevronDownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);


  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const { data, error } = await supabase
            .from('courses_data')
            .select('*')
            .order('course_name', { ascending: true });

        if (error) throw error;
        setCourses(data as Course[]);
    } catch (err: any) {
        console.error("Error fetching courses: ", err);
        setError("Failed to load courses. Please check the console for more details.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();

    const courseSubscription = supabase.channel('public:courses_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses_data' }, () => {
        fetchCourses();
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(courseSubscription);
    };
  }, [fetchCourses]);

  // --- CRUD operations for subjects and topics ---
  const handleSaveSubjectChanges = async (updatedSubject: Subject) => {
    if (!editingSubjectState) return;
    setLoading(true);
    try {
        const { course } = editingSubjectState;
        const updatedSubjectList = (course.subject_list || []).map(s => 
            s.subject_id === updatedSubject.subject_id ? updatedSubject : s
        );

        const { error: updateError } = await supabase
            .from('courses_data')
            .update({ subject_list: updatedSubjectList })
            .eq('id', course.id);
        
        if (updateError) throw updateError;
        
        toast.addToast('success', 'Success', 'Subject updated successfully!');
        setEditingSubjectState(null);
    } catch (err: any) {
        console.error("Error updating subject:", err);
        toast.addToast('error', 'Error', `Failed to update subject: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteSubject = async (subjectId: string) => {
    if (!editingSubjectState || !window.confirm("Are you sure you want to delete this subject and all its topics? This cannot be undone.")) return;
    
    setLoading(true);
    try {
        const { course } = editingSubjectState;
        const updatedSubjectList = (course.subject_list || []).filter(s => s.subject_id !== subjectId);
        
        const { error: updateError } = await supabase
            .from('courses_data')
            .update({ subject_list: updatedSubjectList })
            .eq('id', course.id);

        if (updateError) throw updateError;

        toast.addToast('success', 'Success', 'Subject deleted successfully!');
        setEditingSubjectState(null);
    } catch (err: any) {
        console.error("Error deleting subject:", err);
        toast.addToast('error', 'Error', `Failed to delete subject: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to delete the course "${courseName}"? This will also remove all its levels, subjects, and topics. This action cannot be undone.`)) return;

    setDeletingCourseId(courseId);
    try {
        const { error } = await supabase
            .from('courses_data')
            .delete()
            .eq('id', courseId);
        
        if (error) throw error;
        
        toast.addToast('success', 'Success', `Course "${courseName}" deleted successfully.`);
        // Manually refetch courses to ensure UI consistency, as realtime updates might fail or be disabled.
        await fetchCourses();
    } catch (err: any) {
        console.error("Error deleting course:", err);
        toast.addToast('error', 'Error', `Failed to delete course: ${err.message}`);
    } finally {
        setDeletingCourseId(null);
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
                            <li key={course.id} className="bg-black/20 p-3 rounded-lg text-white flex justify-between items-center">
                                <span>{course.course_name}</span>
                                <button
                                    onClick={() => handleDeleteCourse(course.id, course.course_name)}
                                    disabled={deletingCourseId === course.id}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                                    aria-label={`Delete ${course.course_name}`}
                                >
                                    {deletingCourseId === course.id ? <Spinner size="w-5 h-5" /> : <TrashIcon className="w-5 h-5" />}
                                </button>
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
                  <span className="font-semibold text-white">{course.course_name}</span> - Add levels to this course to manage subjects.
                </div>
              );
            }
            
            const itemKey = `${course.id}-${level}`;
            const isExpanded = expandedItemKey === itemKey;
            const subjectsForLevel = (course.subject_list || []).filter(s => s.level === level);

            return (
              <div key={itemKey} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button 
                  onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                  className="flex justify-between items-center w-full text-left p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg font-semibold text-white">{course.course_name} - {level}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="p-4 border-t border-white/10 animate-[fadeIn_0.5s]">
                    {subjectsForLevel.length > 0 ? (
                      <div className="space-y-2">
                        {subjectsForLevel.map(subject => (
                          <button
                            key={subject.subject_id}
                            onClick={() => setEditingSubjectState({ course, subject })}
                            className="w-full bg-black/30 text-white p-3 rounded-lg text-left hover:bg-indigo-500/30 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{subject.subject_name}</span>
                                {subject.semester && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subject.semester === 'first' ? 'bg-blue-500/30 text-blue-300' : 'bg-green-500/30 text-green-300'}`}>
                                        {subject.semester === 'first' ? '1st Sem' : '2nd Sem'}
                                    </span>
                                )}
                            </div>
                            <span className="block text-xs text-gray-400 mt-1">{subject.topics?.length || 0} topics</span>
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
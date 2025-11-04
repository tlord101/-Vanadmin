import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';
import type { Subject } from '../types';

interface AddSubjectsFromJsonModalProps {
  onClose: () => void;
  courseId: string;
  levelName: string;
  courseName: string;
}

const AddSubjectsFromJsonModal: React.FC<AddSubjectsFromJsonModalProps> = ({ onClose, courseId, levelName, courseName }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(jsonInput);
      if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
        throw new Error("JSON must be an object where keys are subject names and values are arrays of topic names.");
      }
    } catch (error: any) {
      toast.addToast('error', 'Invalid JSON', error.message || 'Please check the format of your JSON.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch the course to get current subject_list
      const { data: courseData, error: fetchError } = await supabase
        .from('courses_data')
        .select('subject_list')
        .eq('id', courseId)
        .single();
      if (fetchError) throw fetchError;

      const currentSubjects: Subject[] = courseData?.subject_list || [];
      const newSubjects: Subject[] = [];
      let skippedCount = 0;

      for (const subjectName in parsedJson) {
        if (Object.prototype.hasOwnProperty.call(parsedJson, subjectName)) {
          const topicNames = parsedJson[subjectName];

          if (!Array.isArray(topicNames) || !topicNames.every(t => typeof t === 'string')) {
            toast.addToast('error', 'Invalid Format', `Topics for "${subjectName}" must be an array of strings.`);
            setIsLoading(false);
            return;
          }
          
          const trimmedSubjectName = subjectName.trim();
          // Check for duplicates
          const subjectExists = currentSubjects.some(s => s.subject_name.toLowerCase() === trimmedSubjectName.toLowerCase() && s.level === levelName);
          if (subjectExists) {
            skippedCount++;
            continue;
          }

          const newSubject: Subject = {
            subject_id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            level: levelName,
            subject_name: trimmedSubjectName,
            semester: 'first', // Default as requested
            topics: topicNames.map((topicName: string) => ({
              topic_id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              topic_name: topicName.trim(),
            })),
          };
          newSubjects.push(newSubject);
        }
      }
      
      if (newSubjects.length === 0) {
        toast.addToast('info', 'No New Subjects', skippedCount > 0 ? `All ${skippedCount} subjects already exist for this level.` : 'No subjects were found in the JSON to add.');
        onClose();
        return;
      }

      // 3. Update the course with the new subject list
      const { error: updateError } = await supabase
        .from('courses_data')
        .update({ subject_list: [...currentSubjects, ...newSubjects] })
        .eq('id', courseId);
      
      if (updateError) throw updateError;

      toast.addToast('success', 'Success', `${newSubjects.length} subject(s) added successfully!`);
      if (skippedCount > 0) {
        toast.addToast('info', 'Duplicates Skipped', `${skippedCount} subject(s) were skipped as they already exist for this level.`);
      }
      onClose();

    } catch (error: any) {
      console.error('Error adding subjects from JSON:', error);
      toast.addToast('error', 'Error', `Failed to add subjects: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
        className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-[zoomIn_0.3s_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-white">Add Subjects via JSON to <span className="text-indigo-400">{courseName} - {levelName}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder='Paste your JSON here... e.g., { "Math 101": ["Algebra", "Calculus"], "Physics 101": ["Mechanics"] }'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            rows={15}
            required
          />
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="font-semibold text-gray-300 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="font-semibold text-white px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center w-40"
            >
              {isLoading ? <Spinner /> : 'Import Subjects'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubjectsFromJsonModal;
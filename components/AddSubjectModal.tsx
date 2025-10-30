import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

const APP_ID = 'vantutor-app';

interface AddSubjectModalProps {
  onClose: () => void;
  courseId: string;
  levelName: string;
}

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({ onClose, courseId, levelName }) => {
  const [subjectName, setSubjectName] = useState('');
  const [topics, setTopics] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleAddTopic = () => {
    setTopics([...topics, '']);
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !levelName) {
        toast.addToast('error', 'Error', 'Course and Level must be selected.');
        return;
    }
    if (!subjectName.trim()) {
      toast.addToast('error', 'Validation Error', 'Subject name cannot be empty.');
      return;
    }
    const validTopics = topics.map(t => t.trim()).filter(t => t !== '');
    if (validTopics.length === 0) {
      toast.addToast('error', 'Validation Error', 'Please add at least one valid topic.');
      return;
    }

    setIsLoading(true);
    try {
        const courseRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'courses', courseId);
        
        const subjectId = `subj_${Date.now()}`;
        const newSubject = {
            level: levelName,
            subjectId,
            subjectName: subjectName.trim(),
            topics: validTopics.map(topicName => ({
                topicId: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                topicName
            }))
        };

        await updateDoc(courseRef, {
            subjectList: arrayUnion(newSubject)
        });

      toast.addToast('success', 'Success', 'Subject and topics added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding subject and topics:', error);
      toast.addToast('error', 'Error', 'Failed to add subject. See console for details.');
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
        className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-[zoomIn_0.3s_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-white">Add New Subject</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Subject Name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
            required
          />

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold text-white">Topics</h3>
            {topics.map((topic, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Topic ${index + 1}`}
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  className="rounded-xl bg-white/10 text-white p-3 flex-grow border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                />
                <button 
                    type="button" 
                    onClick={() => handleRemoveTopic(index)}
                    disabled={topics.length <= 1}
                    className="p-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Remove topic"
                >
                    &ndash;
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddTopic} className="w-full text-center text-indigo-400 font-semibold p-2 rounded-lg hover:bg-white/10 transition-colors">
            + Add Another Topic
          </button>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="font-semibold text-gray-300 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="font-semibold text-white px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center w-36"
            >
              {isLoading ? <Spinner /> : 'Save Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubjectModal;
import React, { useState } from 'react';
import type { Course, Subject } from '../types';
import Spinner from './Spinner';

interface EditSubjectModalProps {
  onClose: () => void;
  course: Course;
  subject: Subject;
  onSave: (subjectId: string, newName: string, newTopics: string[]) => Promise<void>;
  onDelete: (subjectId: string) => Promise<void>;
  onDeleteTopic: (subjectId: string, topicId: string) => Promise<void>;
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ onClose, course, subject, onSave, onDelete, onDeleteTopic }) => {
  const [subjectName, setSubjectName] = useState(subject.subjectName);
  const [newTopics, setNewTopics] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  const handleAddTopic = () => {
    setNewTopics([...newTopics, '']);
  };

  const handleTopicChange = (index: number, value: string) => {
    const updatedTopics = [...newTopics];
    updatedTopics[index] = value;
    setNewTopics(updatedTopics);
  };

  const handleRemoveTopic = (index: number) => {
    if (newTopics.length > 1) {
      setNewTopics(newTopics.filter((_, i) => i !== index));
    }
  };

  const handleDeleteExistingTopic = async (topicId: string, topicName: string) => {
    if (!window.confirm(`Are you sure you want to delete the topic "${topicName}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingTopicId(topicId);
    try {
      await onDeleteTopic(subject.subjectId, topicId);
    } finally {
      setDeletingTopicId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !subjectName.trim()) {
      alert('Subject name cannot be empty.');
      return;
    }
    setIsLoading(true);
    await onSave(subject.subjectId, subjectName.trim(), newTopics.filter(t => t.trim()));
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!subject) return;
    setIsDeleting(true);
    await onDelete(subject.subjectId);
    setIsDeleting(false);
  }

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 transition-opacity duration-300 animate-[fadeIn_0.3s] p-4 pt-16 sm:pt-24 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-lg opacity-0 animate-[zoomIn_0.3s_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-white">Edit Subject</h2>
          <button onClick={onClose} className="text-gray-400 text-3xl hover:text-white transition-colors leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-300 mb-1">Subject Name</label>
            <input
              id="subjectName"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="rounded-xl bg-white/10 text-white p-3 w-full border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
             <h3 className="text-lg font-semibold text-white">Existing Topics</h3>
             {subject?.topics && subject.topics.length > 0 ? (
                <div className="bg-black/20 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                    {subject.topics.map(topic => (
                      <div key={topic.topicId} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-300">{topic.topicName}</span>
                        {deletingTopicId === topic.topicId ? (
                          <Spinner size="h-4 w-4" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingTopic(topic.topicId, topic.topicName)}
                            className="p-1.5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors"
                            aria-label={`Delete ${topic.topicName}`}
                            title="Delete topic"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                </div>
             ) : <p className="text-gray-400 italic">No topics exist yet.</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Add New Topics</h3>
            {newTopics.map((topic, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`New Topic ${index + 1}`}
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  className="rounded-xl bg-white/10 text-white p-3 flex-grow border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                />
                <button 
                    type="button" 
                    onClick={() => handleRemoveTopic(index)}
                    disabled={newTopics.length <= 1}
                    className="p-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Remove topic"
                >
                    &ndash;
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddTopic} className="w-full text-center text-indigo-400 font-semibold p-2 rounded-lg hover:bg-white/10 transition-colors">
            + Add Another Topic Field
          </button>
          
          <div className="flex justify-between items-center gap-4 pt-4">
            <button 
                type="button"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="font-semibold text-red-400 px-6 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex justify-center items-center w-36"
            >
              {isDeleting ? <Spinner /> : 'Delete Subject'}
            </button>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="font-semibold text-gray-300 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                Cancel
                </button>
                <button
                type="submit"
                disabled={isLoading || isDeleting}
                className="font-semibold text-white px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center w-36"
                >
                {isLoading ? <Spinner /> : 'Save Changes'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubjectModal;

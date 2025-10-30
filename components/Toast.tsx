import React from 'react';
import { useToast, ToastMessage, ToastType } from '../contexts/ToastContext';

// Icons
const SuccessIcon = () => (<svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const ErrorIcon = () => (<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const InfoIcon = () => (<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);

const toastIcons: { [key in ToastType]: React.ReactNode } = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  info: <InfoIcon />,
};

const toastColors: { [key in ToastType]: string } = {
  success: 'border-green-500/50',
  error: 'border-red-500/50',
  info: 'border-blue-500/50',
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    return (
        <div 
            className={`flex items-start p-4 mb-4 w-full max-w-sm bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl border ${toastColors[toast.type]} animate-[slideInRight_0.3s_ease-out]`}
            role="alert"
        >
            <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
            <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-bold text-white">{toast.title}</p>
                <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm">
        {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
    </div>
  );
};

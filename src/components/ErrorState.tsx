import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="w-full max-w-md mx-auto my-20 p-8 bg-white border border-red-100 rounded-2xl shadow-lg flex flex-col items-center text-center animate-fade-in">
      <div className="p-4 bg-red-50 text-brand-danger rounded-full">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mt-6">Dashboard Analysis Error</h3>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {message || 'An unexpected error occurred while parsing the CSV dataset. Please check the file formatting and structure.'}
      </p>

      <button
        onClick={onRetry}
        className="mt-8 flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Upload Another File</span>
      </button>
    </div>
  );
};

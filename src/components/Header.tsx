import React from 'react';
import { FileSpreadsheet, TrendingUp } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="bg-brand-accent p-2 rounded-lg text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-brand tracking-tight">Rohit's Visualizer</span>
            <span className="hidden sm:inline-block ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              CSV Dashboard Generator
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          {hasData && (
            <button
              onClick={onReset}
              className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1.5 rounded-lg shadow-sm transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload New File</span>
              <span className="inline sm:hidden">Upload</span>
            </button>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
};

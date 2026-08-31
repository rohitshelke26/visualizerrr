import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: () => void;
  onError: (error: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, onSampleSelect, onError }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (!file) return;

    // Check extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && file.type !== 'text/csv') {
      onError('Invalid file format. Please upload a standard comma-separated values (.csv) file.');
      return;
    }

    // Check size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      onError('File is too large. The browser processing engine supports files up to 50MB.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center space-x-1.5 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full text-brand-accent text-xs font-semibold mb-6 animate-fade-in">
        <span>New</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
        <span className="text-slate-700">100% Client-Side Private Analysis</span>
      </div>

      {/* Hero Header */}
      <h1 className="text-center font-extrabold text-4xl sm:text-5xl md:text-6xl text-brand tracking-tight max-w-3xl leading-tight">
        Turn Your CSV Data Into a{' '}
        <span className="bg-gradient-to-r from-brand-accent to-indigo-600 bg-clip-text text-transparent">
          Professional Dashboard
        </span>
      </h1>
      <p className="text-center text-slate-500 text-lg sm:text-xl mt-4 max-w-2xl font-light">
        Upload your corporate dataset and automatically generate an interactive business intelligence dashboard in seconds.
      </p>

      {/* Drag and Drop Container */}
      <div
        className={`w-full bg-white mt-12 p-10 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-md ${
          isDragActive
            ? 'border-brand-accent bg-blue-50/20 scale-[0.99] shadow-inner'
            : 'border-slate-300 hover:border-brand-accent hover:shadow-lg hover:scale-[1.01]'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,text/csv"
          onChange={handleInputChange}
        />

        <div className={`p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-brand-accent transition-colors duration-300 ${isDragActive ? 'bg-blue-100/50 text-brand-accent' : ''}`}>
          <UploadCloud className="w-12 h-12" />
        </div>

        <p className="mt-6 text-lg font-semibold text-slate-700 text-center">
          Drag & drop your CSV file here
        </p>
        <p className="mt-1 text-sm text-slate-400 text-center">
          or <span className="text-brand-accent font-medium hover:underline">browse files</span> on your computer
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <span className="flex items-center space-x-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>Format: CSV</span>
          </span>
          <span>Max file size: 50MB</span>
          <span className="flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Encoding: UTF-8</span>
          </span>
        </div>
      </div>

      {/* Sample Data Load Button */}
      <div className="mt-12 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <span className="text-sm text-slate-400 font-medium">No CSV file on hand?</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSampleSelect();
          }}
          className="group flex items-center space-x-2 bg-slate-900 text-white font-medium text-sm px-6 py-3 rounded-xl hover:bg-brand-accent transition-all duration-300 shadow-md hover:shadow-brand-accent/20 hover:-translate-y-0.5"
        >
          <span>Try with sample dataset</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Feature trust grid */}
      <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-slate-200/60 pt-10">
        <div className="flex space-x-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center font-bold">1</div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Automated Profiling</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Instantly detects metric types, date configurations, percentages, and currencies to auto-design charts.
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center font-bold">2</div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Interactive Slicers</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Drill down into regions, categories, and calendar ranges. Watch all KPIs and graphs update instantly.
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 h-10 w-10 rounded-lg flex items-center justify-center font-bold">3</div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Landscape PDF Export</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export high-resolution executive-ready reports formatted correctly across landscape pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

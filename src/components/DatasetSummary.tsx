import React from 'react';
import { Database, HelpCircle, Columns, ListFilter, CalendarRange } from 'lucide-react';
import type { DatasetAnalysis } from '../types/dataset';
import { formatNumber } from '../lib/dataFormatter';

interface DatasetSummaryProps {
  analysis: DatasetAnalysis;
  filename: string;
}

export const DatasetSummary: React.FC<DatasetSummaryProps> = ({ analysis, filename }) => {
  const numericCount = analysis.columns.filter((c) => c.type === 'numeric').length;
  const categoricalCount = analysis.columns.filter((c) => c.type === 'categorical' || c.type === 'boolean').length;
  const dateCount = analysis.columns.filter((c) => c.type === 'date').length;
  const otherCount = analysis.columnCount - (numericCount + categoricalCount + dateCount);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 no-print">
      <div className="flex items-center space-x-2 text-slate-700 pb-3 border-b border-slate-100">
        <Database className="w-4 h-4 text-brand-accent" />
        <h4 className="font-bold text-sm tracking-tight uppercase">Dataset Overview</h4>
      </div>

      <div className="mt-4 space-y-4">
        {/* Filename Header */}
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Source File</span>
          <span className="text-sm font-semibold text-slate-700 truncate block mt-0.5" title={filename}>
            {filename || 'Uploaded Dataset'}
          </span>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Rows</span>
            <span className="text-base font-extrabold text-brand mt-0.5">
              {formatNumber(analysis.rowCount)}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Columns</span>
            <span className="text-base font-extrabold text-brand mt-0.5">
              {formatNumber(analysis.columnCount)}
            </span>
          </div>
        </div>

        {/* Data Types breakdown list */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Column Classifications</span>
          
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <Columns className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Numeric Fields</span>
            </span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              {numericCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <ListFilter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Categorical / Boolean</span>
            </span>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              {categoricalCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center space-x-1.5 text-slate-500">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Date Dimensions</span>
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              {dateCount}
            </span>
          </div>

          {otherCount > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center space-x-1.5 text-slate-500 font-light">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Text / ID (Cardinality)</span>
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                {otherCount}
              </span>
            </div>
          )}
        </div>

        {/* Quality indicator / missing values */}
        <div className="pt-3 border-t border-slate-100 text-xs flex justify-between items-center">
          <span className="text-slate-400 font-normal">Missing values detected:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
              analysis.missingValuesTotal > 0
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-brand-success'
            }`}
          >
            {analysis.missingValuesTotal > 0
              ? `${formatNumber(analysis.missingValuesTotal)} cells`
              : 'None (Clean)'}
          </span>
        </div>
      </div>
    </div>
  );
};

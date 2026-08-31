import React, { useState } from 'react';
import { Filter, Calendar, X, ChevronDown } from 'lucide-react';
import type { FilterDefinition, DateFilterValue } from '../types/dashboard';

interface FilterBarProps {
  filters: FilterDefinition[];
  onFilterChange: (columnName: string, selectedValues: string[]) => void;
  dateFilter?: DateFilterValue;
  onDateFilterChange: (value: DateFilterValue) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  minMaxDates?: { min: string; max: string };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  hasActiveFilters,
  minMaxDates,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (colName: string) => {
    setOpenDropdown(openDropdown === colName ? null : colName);
  };

  const handleCheckboxChange = (columnName: string, value: string, checked: boolean) => {
    const filter = filters.find((f) => f.columnName === columnName);
    if (!filter) return;

    let newSelected: string[];
    if (checked) {
      newSelected = [...filter.selectedValues, value];
    } else {
      newSelected = filter.selectedValues.filter((v) => v !== value);
    }
    onFilterChange(columnName, newSelected);
  };

  const handleDatePresetChange = (preset: DateFilterValue['preset']) => {
    if (preset === 'custom') {
      onDateFilterChange({
        preset,
        startDate: minMaxDates?.min || '',
        endDate: minMaxDates?.max || '',
      });
    } else {
      onDateFilterChange({ preset });
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm no-print">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters Title */}
        <div className="flex items-center space-x-2 text-slate-700 shrink-0">
          <Filter className="w-4 h-4 text-brand-accent" />
          <span className="font-semibold text-sm">Dashboard Slicers</span>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="flex flex-wrap items-center gap-3 flex-1 px-0 md:px-4">
          {/* Categorical Dropdowns */}
          {filters.map((filter) => {
            const hasSelections = filter.selectedValues.length > 0;
            const isOpen = openDropdown === filter.columnName;

            return (
              <div key={filter.columnName} className="relative">
                <button
                  onClick={() => toggleDropdown(filter.columnName)}
                  className={`flex items-center justify-between space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors bg-white hover:bg-slate-50 ${
                    hasSelections
                      ? 'border-brand-accent text-brand-accent bg-blue-50/10'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate max-w-[120px]">
                    {filter.displayName}:{' '}
                    {hasSelections
                      ? `${filter.selectedValues.length} selected`
                      : 'All'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Box */}
                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                    <div className="absolute left-0 mt-1.5 w-56 max-w-[calc(100vw-32px)] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-2 animate-fade-in">
                      <div className="flex justify-between items-center px-2 py-1 mb-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-semibold uppercase">
                        <span>Select Options</span>
                        {hasSelections && (
                          <button
                            onClick={() => onFilterChange(filter.columnName, [])}
                            className="text-brand-accent hover:underline lowercase"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {filter.options.map((option) => {
                          const isChecked = filter.selectedValues.includes(option);
                          return (
                            <label
                              key={option}
                              className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-xs text-slate-600 font-normal"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleCheckboxChange(filter.columnName, option, e.target.checked)
                                }
                                className="rounded text-brand-accent focus:ring-brand-accent/30 border-slate-300 w-3.5 h-3.5"
                              />
                              <span className="truncate">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Temporal Date Filter Dropdown */}
          {dateFilter && minMaxDates && (
            <div className="relative">
              <button
                onClick={() => toggleDropdown('date_filter_col')}
                className={`flex items-center justify-between space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium bg-white hover:bg-slate-50 transition-colors ${
                  dateFilter.preset !== 'all'
                    ? 'border-brand-accent text-brand-accent bg-blue-50/10'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Date:{' '}
                  {dateFilter.preset === 'all'
                    ? 'All Time'
                    : dateFilter.preset === 'custom'
                    ? `${dateFilter.startDate} to ${dateFilter.endDate}`
                    : dateFilter.preset.replace('-', ' ')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'date_filter_col' ? 'rotate-180' : ''}`} />
              </button>

              {/* Date Filter Dropdown Options */}
              {openDropdown === 'date_filter_col' && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                  <div className="absolute right-0 md:left-0 mt-1.5 w-64 max-w-[calc(100vw-32px)] bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-3 animate-fade-in">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase border-b border-slate-100 pb-1 mb-2">
                      Date Range Preset
                    </div>
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      {(['all', 'today', 'this-month', 'this-quarter', 'this-year', 'custom'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleDatePresetChange(preset)}
                          className={`text-left px-2 py-1.5 text-xs rounded-md transition-colors ${
                            dateFilter.preset === preset
                              ? 'bg-brand-accent text-white font-medium'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {preset === 'all' ? 'All Time' : preset.replace('-', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Custom Date Input Pickers */}
                    {dateFilter.preset === 'custom' && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium uppercase block mb-1">Start Date</label>
                          <input
                            type="date"
                            min={minMaxDates.min}
                            max={minMaxDates.max}
                            value={dateFilter.startDate || ''}
                            onChange={(e) =>
                              onDateFilterChange({
                                ...dateFilter,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full text-xs border border-slate-200 rounded p-1.5 focus:border-brand-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium uppercase block mb-1">End Date</label>
                          <input
                            type="date"
                            min={minMaxDates.min}
                            max={minMaxDates.max}
                            value={dateFilter.endDate || ''}
                            onChange={(e) =>
                              onDateFilterChange({
                                ...dateFilter,
                                endDate: e.target.value,
                              })
                            }
                            className="w-full text-xs border border-slate-200 rounded p-1.5 focus:border-brand-accent focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-xs font-semibold transition-colors duration-200 self-end md:self-auto shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Slicers</span>
          </button>
        )}
      </div>
    </div>
  );
};

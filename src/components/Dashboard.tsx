import React, { useState, useMemo } from 'react';
import { Download, RefreshCw, Layers, BarChart2 } from 'lucide-react';
import type { DatasetAnalysis } from '../types/dataset';
import type { ActiveFilters, DateFilterValue, KPIResult, ChartDefinition, FilterDefinition } from '../types/dashboard';
import { KPICard } from './KPICard';
import { FilterBar } from './FilterBar';
import { ChartCard } from './ChartCard';
import { DatasetSummary } from './DatasetSummary';
import { generateKPIs } from '../lib/kpiGenerator';
import { selectCharts } from '../lib/chartSelector';
import { generateDashboardPDF } from '../lib/pdfGenerator';
import { formatNumber } from '../lib/dataFormatter';

interface DashboardProps {
  originalData: Record<string, any>[];
  analysis: DatasetAnalysis;
  filename: string;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  originalData,
  analysis,
  filename,
  onReset,
}) => {
  // Active Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    categorical: {},
  });

  // PDF download progress/loading state
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  // Dynamic Dashboard Title builder using formatted CSV filename
  const dashboardTitle = useMemo(() => {
    if (!filename) return 'Data Analytics Dashboard';
    
    // Strip .csv extension
    let title = filename.replace(/\.csv$/i, '');
    
    // Replace dashes and underscores with spaces
    title = title.replace(/[-_]+/g, ' ');
    
    // Convert to Title Case (capitalize first letter of each word)
    return title
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [filename]);

  // Extract min/max dates for calendar filters
  const minMaxDates = useMemo(() => {
    const dateCol = analysis.columns.find((c) => c.type === 'date');
    if (dateCol && dateCol.dateStats) {
      return {
        min: dateCol.dateStats.min,
        max: dateCol.dateStats.max,
      };
    }
    return undefined;
  }, [analysis]);

  // Initialize categorical filter definitions
  const filterDefinitions = useMemo<FilterDefinition[]>(() => {
    // Choose categorical columns with cardinality >= 2 and <= 20
    return analysis.columns
      .filter((c) => {
        const typeMatch = c.type === 'categorical' || c.type === 'boolean';
        const card = c.categoricalStats?.uniqueCount || 0;
        return typeMatch && card >= 2 && card <= 20;
      })
      .slice(0, 4) // Show maximum of 4 slicers to keep UI tidy
      .map((col) => ({
        columnName: col.name,
        displayName: col.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        options: (col.categoricalStats?.frequencies || []).map((f) => f.value),
        selectedValues: activeFilters.categorical[col.name] || [],
      }));
  }, [analysis, activeFilters]);

  // Handle categorical filter change
  const handleFilterChange = (columnName: string, selectedValues: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      categorical: {
        ...prev.categorical,
        [columnName]: selectedValues,
      },
    }));
  };

  // Handle date filter change
  const handleDateFilterChange = (value: DateFilterValue) => {
    setActiveFilters((prev) => ({
      ...prev,
      date: value,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({
      categorical: {},
    });
  };

  const hasActiveFilters = useMemo(() => {
    const hasCats = Object.values(activeFilters.categorical).some((val) => val.length > 0);
    const hasDate = activeFilters.date && activeFilters.date.preset !== 'all';
    return !!(hasCats || hasDate);
  }, [activeFilters]);

  // Filter raw rows reactively
  const filteredData = useMemo(() => {
    return originalData.filter((row) => {
      // 1. Categorical Filters check
      for (const [colName, selected] of Object.entries(activeFilters.categorical)) {
        if (selected.length === 0) continue;
        const cellVal = row[colName] === null || row[colName] === undefined ? 'Unknown' : String(row[colName]);
        if (!selected.includes(cellVal)) {
          return false;
        }
      }

      // 2. Date preset filters check
      if (activeFilters.date && activeFilters.date.preset !== 'all') {
        const dateCol = analysis.columns.find((c) => c.type === 'date');
        if (dateCol) {
          const cellDateVal = row[dateCol.name];
          if (!cellDateVal) return false;
          
          const rowDate = new Date(cellDateVal);
          if (isNaN(rowDate.getTime())) return false;

          const { preset, startDate, endDate } = activeFilters.date;
          const now = new Date();

          if (preset === 'custom') {
            if (startDate && rowDate < new Date(startDate + 'T00:00:00')) return false;
            if (endDate && rowDate > new Date(endDate + 'T23:59:59')) return false;
          } else if (preset === 'today') {
            const today = new Date();
            if (
              rowDate.getFullYear() !== today.getFullYear() ||
              rowDate.getMonth() !== today.getMonth() ||
              rowDate.getDate() !== today.getDate()
            ) {
              return false;
            }
          } else if (preset === 'this-month') {
            if (rowDate.getFullYear() !== now.getFullYear() || rowDate.getMonth() !== now.getMonth()) {
              return false;
            }
          } else if (preset === 'this-quarter') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const rowQuarter = Math.floor(rowDate.getMonth() / 3);
            if (rowDate.getFullYear() !== now.getFullYear() || rowQuarter !== currentQuarter) {
              return false;
            }
          } else if (preset === 'this-year') {
            if (rowDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [originalData, activeFilters, analysis]);

  // Re-generate KPIs based on filtered rows
  const kpis = useMemo<KPIResult[]>(() => {
    return generateKPIs(filteredData, analysis);
  }, [filteredData, analysis]);

  // Re-generate Charts based on filtered rows
  const charts = useMemo<ChartDefinition[]>(() => {
    return selectCharts(filteredData, analysis);
  }, [filteredData, analysis]);

  // Trigger PDF Generation
  const handlePdfExport = () => {
    setPdfStatus('Preparing PDF layout...');
    
    // Yield to the event loop to let React paint the loading overlay instantly
    setTimeout(async () => {
      try {
        await generateDashboardPDF(filename, (status) => setPdfStatus(status));
        setPdfStatus(null);
      } catch (e: any) {
        alert(`PDF Generation failed: ${e.message || e}`);
        setPdfStatus(null);
      }
    }, 100);
  };

  // Find column settings for tooltip formatting
  const getColMeta = (colName: string) => {
    return analysis.columns.find((c) => c.name === colName);
  };

  const primaryColMeta = getColMeta(analysis.primaryMetric);
  const secondaryColMeta = getColMeta(analysis.secondaryMetrics[0]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand tracking-tight">
            {dashboardTitle}
          </h2>
          <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-400 font-medium">
            <span>File: <span className="font-semibold text-slate-600">{filename}</span></span>
            <span>•</span>
            <span>Total records: <span className="font-semibold text-slate-600">{formatNumber(originalData.length)}</span></span>
            {hasActiveFilters && (
              <>
                <span>•</span>
                <span className="text-brand-accent">
                  Filtered: <strong>{formatNumber(filteredData.length)}</strong> records
                </span>
              </>
            )}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload Dataset</span>
          </button>
          
          <button
            onClick={handlePdfExport}
            disabled={pdfStatus !== null}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-brand-accent transition-colors shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{pdfStatus ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Overlay Loading spinner */}
      {pdfStatus && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full flex items-center space-x-4 border border-slate-100 animate-fade-in">
            <RefreshCw className="w-6 h-6 text-brand-accent animate-spin shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-800">Converting to PDF, please wait...</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{pdfStatus}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {kpis.map((kpi, idx) => (
          <KPICard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            changePercent={kpi.changePercent}
            isPositive={kpi.isPositive}
            iconName={kpi.icon}
          />
        ))}
      </div>

      {/* 3. Slicers Bar & Dataset Summary side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 no-print">
        <div className="lg:col-span-2">
          <FilterBar
            filters={filterDefinitions}
            onFilterChange={handleFilterChange}
            dateFilter={
              analysis.columns.find((c) => c.type === 'date')
                ? activeFilters.date || { preset: 'all' }
                : undefined
            }
            onDateFilterChange={handleDateFilterChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            minMaxDates={minMaxDates}
          />
        </div>
        <div className="lg:col-span-1">
          <DatasetSummary analysis={analysis} filename={filename} />
        </div>
      </div>

      {/* 4. Visualizations Grid */}
      {filteredData.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center my-8 shadow-sm flex flex-col items-center no-print">
          <Layers className="w-12 h-12 text-slate-300" />
          <h4 className="font-bold text-slate-700 mt-4 text-base">No Data Matches Filter Slicers</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            All rows were filtered out. Adjust your filters or click "Reset Slicers" to display visualizations.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-6 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-brand-accent transition-colors"
          >
            Reset Slicers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 no-print">
          {charts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              isCurrency={
                chart.id === 'secondary-metric-chart'
                  ? secondaryColMeta?.isCurrency
                  : primaryColMeta?.isCurrency
              }
              isPercentage={
                chart.id === 'secondary-metric-chart'
                  ? secondaryColMeta?.isPercentage
                  : primaryColMeta?.isPercentage
              }
              currencySymbol={
                chart.id === 'secondary-metric-chart'
                  ? secondaryColMeta?.currencySymbol
                  : primaryColMeta?.currencySymbol
              }
              isSecondaryCurrency={primaryColMeta?.isCurrency}
              isSecondaryPercentage={primaryColMeta?.isPercentage}
              secondaryCurrencySymbol={primaryColMeta?.currencySymbol}
            />
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PDF HIGH-RESOLUTION OFF-SCREEN TEMPLATE CONTAINER                     */}
      {/* ========================================================================= */}
      <div className="absolute left-[-9999px] top-[-9999px] w-[1120px] bg-slate-50 opacity-0 pointer-events-none no-print">
        
        {/* PAGE 1: HEADER + KPIS + FIRST 4 CHARTS */}
        <div id="pdf-page-1" className="w-[1120px] h-[792px] p-8 bg-white flex flex-col justify-between border border-slate-100 shadow-inner">
          <div className="flex-1 flex flex-col justify-start">
            {/* PDF Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{dashboardTitle}</h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Source: {filename} • Date Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-right">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  BI EXECUTIVE REPORT
                </span>
              </div>
            </div>

            {/* Active Filters list banner in PDF */}
            <div className="bg-slate-50 p-2 border border-slate-200/60 rounded-lg mt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span>
                <strong>Slicer State:</strong>{' '}
                {hasActiveFilters ? (
                  Object.entries(activeFilters.categorical)
                    .filter(([_, sel]) => sel.length > 0)
                    .map(([col, sel]) => `${col}: [${sel.join(', ')}]`)
                    .join(' | ') +
                  (activeFilters.date && activeFilters.date.preset !== 'all'
                    ? ` | Date: [${activeFilters.date.preset === 'custom' ? `${activeFilters.date.startDate} to ${activeFilters.date.endDate}` : activeFilters.date.preset}]`
                    : '')
                ) : (
                  'All Filters Reset (Unfiltered Dataset)'
                )}
              </span>
              <span>
                Records analyzed: <strong>{formatNumber(filteredData.length)}</strong> of {formatNumber(originalData.length)}
              </span>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 pt-4 flex flex-col justify-between min-h-[85px] bg-slate-50/50">
                  <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block leading-normal pt-0.5 pb-0.5 truncate">{kpi.title}</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight mt-1 leading-none">{kpi.value}</span>
                  {kpi.changePercent !== undefined ? (
                    <span className={`text-[9px] font-bold mt-1 ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.isPositive ? '▲' : '▼'} {Math.abs(kpi.changePercent).toFixed(1)}% vs prev
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 mt-1">Aggregation</span>
                  )}
                </div>
              ))}
            </div>

            {/* Charts Grid Page 1 */}
            {charts.length <= 5 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {charts.slice(0, 3).map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={{ ...chart, description: undefined }}
                    heightClass="h-[215px]"
                    isAnimated={false}
                    isCurrency={primaryColMeta?.isCurrency}
                    isPercentage={primaryColMeta?.isPercentage}
                    currencySymbol={primaryColMeta?.currencySymbol}
                    isSecondaryCurrency={secondaryColMeta?.isCurrency}
                    isSecondaryPercentage={secondaryColMeta?.isPercentage}
                    secondaryCurrencySymbol={secondaryColMeta?.currencySymbol}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 mt-6">
                {charts.slice(0, 2).map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={{ ...chart, description: undefined }}
                    heightClass="h-[320px]"
                    isAnimated={false}
                    isCurrency={primaryColMeta?.isCurrency}
                    isPercentage={primaryColMeta?.isPercentage}
                    currencySymbol={primaryColMeta?.currencySymbol}
                    isSecondaryCurrency={secondaryColMeta?.isCurrency}
                    isSecondaryPercentage={secondaryColMeta?.isPercentage}
                    secondaryCurrencySymbol={secondaryColMeta?.currencySymbol}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PDF Footer */}
          <div className="flex justify-end items-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-4 shrink-0">
            <span className="font-semibold text-slate-600">Page 1 of {charts.length <= 5 ? '2' : '3'}</span>
          </div>
        </div>

        {/* PAGE 2: SECONDARY CHARTS */}
        <div id="pdf-page-2" className="w-[1120px] h-[792px] p-8 bg-white flex flex-col justify-between border border-slate-100 shadow-inner">
          <div className="flex-1 flex flex-col justify-start">
            {/* PDF Header Page 2 */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">{dashboardTitle}</h1>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                  Source: {filename} • Secondary Analysis Matrix
                </p>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                BI EXECUTIVE REPORT
              </span>
            </div>

            {/* Charts Grid Page 2 */}
            {charts.length <= 5 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {charts.slice(3, 5).map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={{ ...chart, description: undefined }}
                    heightClass="h-[215px]"
                    isAnimated={false}
                    isCurrency={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.isCurrency
                        : primaryColMeta?.isCurrency
                    }
                    isPercentage={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.isPercentage
                        : primaryColMeta?.isPercentage
                    }
                    currencySymbol={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.currencySymbol
                        : primaryColMeta?.currencySymbol
                    }
                    isSecondaryCurrency={primaryColMeta?.isCurrency}
                    isSecondaryPercentage={primaryColMeta?.isPercentage}
                    secondaryCurrencySymbol={primaryColMeta?.currencySymbol}
                  />
                ))}
                
                {/* Summary Card as the 3rd element in the 2-page layout */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 h-[215px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase border-b border-slate-200 pb-1.5 flex items-center">
                      <BarChart2 className="w-3.5 h-3.5 mr-1.5 text-brand-accent animate-pulse" />
                      <span>Dataset summary</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">Source File</span>
                        <span className="truncate block max-w-[100px]" title={filename}>{filename}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Rows</span>
                        <span>{formatNumber(originalData.length)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">Numeric Columns</span>
                        <span>{analysis.columns.filter(c => c.type === 'numeric').length}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">Dimensions</span>
                        <span>{analysis.columns.filter(c => c.type === 'categorical' || c.type === 'boolean' || c.type === 'date').length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
                    <span>Data Quality Status:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold ${analysis.missingValuesTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {analysis.missingValuesTotal > 0 ? 'Warning' : 'Clean'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {charts.slice(2, 6).map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={{ ...chart, description: undefined }}
                    heightClass="h-[250px]"
                    isAnimated={false}
                    isCurrency={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.isCurrency
                        : primaryColMeta?.isCurrency
                    }
                    isPercentage={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.isPercentage
                        : primaryColMeta?.isPercentage
                    }
                    currencySymbol={
                      chart.id === 'secondary-metric-chart'
                        ? secondaryColMeta?.currencySymbol
                        : primaryColMeta?.currencySymbol
                    }
                    isSecondaryCurrency={primaryColMeta?.isCurrency}
                    isSecondaryPercentage={primaryColMeta?.isPercentage}
                    secondaryCurrencySymbol={primaryColMeta?.currencySymbol}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PDF Footer Page 2 */}
          <div className="flex justify-end items-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-4 shrink-0">
            <span className="font-semibold text-slate-600">Page 2 of {charts.length <= 5 ? '2' : '3'}</span>
          </div>
        </div>

        {/* PAGE 3: ADDITIONAL CHARTS + OVERVIEW SUMMARY (3-page PDF only) */}
        {charts.length > 5 && (
          <div id="pdf-page-3" className="w-[1120px] h-[792px] p-8 bg-white flex flex-col justify-between border border-slate-100 shadow-inner">
            <div className="flex-1 flex flex-col justify-start">
              {/* PDF Header Page 3 */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight">{dashboardTitle}</h1>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                    Source: {filename} • Dataset Summary & Analytics
                  </p>
                </div>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  BI EXECUTIVE REPORT
                </span>
              </div>

              {/* Dynamic grid depending on remaining charts length */}
              {charts.slice(6, 8).length === 0 ? (
                <div className="flex items-center justify-center h-[500px]">
                  <div className="border border-slate-200 rounded-lg p-6 bg-slate-50/50 w-full max-w-xl h-[320px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-700 uppercase border-b border-slate-200 pb-2.5 flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2 text-brand-accent animate-pulse" />
                        <span>Dataset summary</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-6 mt-4 text-xs text-slate-500 font-medium">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Source File</span>
                          <span className="truncate block max-w-[200px]" title={filename}>{filename}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Rows</span>
                          <span>{formatNumber(originalData.length)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Numeric Columns</span>
                          <span>{analysis.columns.filter(c => c.type === 'numeric').length}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Dimensions</span>
                          <span>{analysis.columns.filter(c => c.type === 'categorical' || c.type === 'boolean' || c.type === 'date').length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                      <span>Data Quality Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${analysis.missingValuesTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {analysis.missingValuesTotal > 0 ? 'Warning' : 'Clean'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : charts.slice(6, 8).length === 1 ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {charts.slice(6, 7).map((chart) => (
                    <ChartCard
                      key={chart.id}
                      chart={{ ...chart, description: undefined }}
                      heightClass="h-[260px]"
                      isAnimated={false}
                      isCurrency={primaryColMeta?.isCurrency}
                      isPercentage={primaryColMeta?.isPercentage}
                      currencySymbol={primaryColMeta?.currencySymbol}
                      isSecondaryCurrency={secondaryColMeta?.isCurrency}
                      isSecondaryPercentage={secondaryColMeta?.isPercentage}
                      secondaryCurrencySymbol={primaryColMeta?.currencySymbol}
                    />
                  ))}
                  
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 h-[260px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-700 uppercase border-b border-slate-200 pb-1.5 flex items-center">
                        <BarChart2 className="w-3.5 h-3.5 mr-1.5 text-brand-accent animate-pulse" />
                        <span>Dataset summary</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Source File</span>
                          <span className="truncate block max-w-[100px]" title={filename}>{filename}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Rows</span>
                          <span>{formatNumber(originalData.length)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Numeric Columns</span>
                          <span>{analysis.columns.filter(c => c.type === 'numeric').length}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Dimensions</span>
                          <span>{analysis.columns.filter(c => c.type === 'categorical' || c.type === 'boolean' || c.type === 'date').length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
                      <span>Data Quality Status:</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${analysis.missingValuesTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {analysis.missingValuesTotal > 0 ? 'Warning' : 'Clean'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {charts.slice(6, 8).map((chart) => (
                    <ChartCard
                      key={chart.id}
                      chart={{ ...chart, description: undefined }}
                      heightClass="h-[250px]"
                      isAnimated={false}
                      isCurrency={primaryColMeta?.isCurrency}
                      isPercentage={primaryColMeta?.isPercentage}
                      currencySymbol={primaryColMeta?.currencySymbol}
                      isSecondaryCurrency={secondaryColMeta?.isCurrency}
                      isSecondaryPercentage={secondaryColMeta?.isPercentage}
                      secondaryCurrencySymbol={primaryColMeta?.currencySymbol}
                    />
                  ))}
                  
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 h-[200px] col-span-2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-700 uppercase border-b border-slate-200 pb-1.5 flex items-center">
                        <BarChart2 className="w-3.5 h-3.5 mr-1.5 text-brand-accent animate-pulse" />
                        <span>Dataset summary</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Source File</span>
                          <span className="truncate block max-w-[200px]" title={filename}>{filename}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Rows</span>
                          <span>{formatNumber(originalData.length)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Numeric Columns</span>
                          <span>{analysis.columns.filter(c => c.type === 'numeric').length}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold block uppercase">Dimensions</span>
                          <span>{analysis.columns.filter(c => c.type === 'categorical' || c.type === 'boolean' || c.type === 'date').length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
                      <span>Data Quality Status:</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${analysis.missingValuesTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {analysis.missingValuesTotal > 0 ? 'Warning' : 'Clean'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Footer Page 3 */}
            <div className="flex justify-end items-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-4 shrink-0">
              <span className="font-semibold text-slate-600">Page 3 of 3</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

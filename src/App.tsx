import { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './components/Dashboard';
import { ErrorState } from './components/ErrorState';
import { parseCSV } from './lib/csvParser';
import { analyzeDataset } from './lib/dataAnalyzer';
import { getSampleCSV } from './lib/sampleData';
import type { DatasetAnalysis } from './types/dataset';

type AppView = 'upload' | 'loading' | 'dashboard' | 'error';

function App() {
  const [view, setView] = useState<AppView>('upload');
  const [errorMsg, setErrorMsg] = useState('');
  const [filename, setFilename] = useState('');
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);

  // Temporary storage during upload transitions
  const [pendingCSVString, setPendingCSVString] = useState<string | null>(null);

  // Triggered when loading screen completes its analysis ticks
  const handleLoadingComplete = () => {
    if (!pendingCSVString) {
      setView('error');
      setErrorMsg('No CSV content could be retrieved.');
      return;
    }

    try {
      const parsed = parseCSV(pendingCSVString);
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setView('error');
        setErrorMsg(parsed.errors.join('\n'));
        return;
      }

      if (parsed.data.length === 0) {
        setView('error');
        setErrorMsg('The CSV file is empty or missing headers.');
        return;
      }

      const analyzed = analyzeDataset(parsed.data, parsed.headers, parsed.inferredMetaData);
      
      // Verification: Make sure there's at least one numeric measure
      if (!analyzed.primaryMetric) {
        setView('error');
        setErrorMsg('We could not detect any numeric fields (Sales, Revenue, Cost, counts, etc.) to analyze. Please upload a dataset with structured numeric data.');
        return;
      }

      // Check if dataset is too large (e.g. > 200,000 rows in browser could be sluggish)
      const MAX_ROWS = 200000;
      if (parsed.data.length > MAX_ROWS) {
        setView('error');
        setErrorMsg(`The dataset is too large (${parsed.data.length.toLocaleString()} rows). The client-side dashboard engine supports files up to ${MAX_ROWS.toLocaleString()} rows.`);
        return;
      }

      setRawData(parsed.data);
      setAnalysis(analyzed);
      setView('dashboard');
      setPendingCSVString(null);
    } catch (e: any) {
      setView('error');
      setErrorMsg(`Analysis Error: ${e.message || e}`);
      setPendingCSVString(null);
    }
  };

  // Reader for uploaded files
  const handleFileSelect = (file: File) => {
    setFilename(file.name);
    setView('loading');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPendingCSVString(text);
    };
    reader.onerror = () => {
      setView('error');
      setErrorMsg('Failed to read the file contents. Please try again.');
    };
    reader.readAsText(file);
  };

  // Loader for pre-built sample data
  const handleSampleSelect = () => {
    setFilename('sample_sales_data.csv');
    setView('loading');
    const csvContent = getSampleCSV();
    setPendingCSVString(csvContent);
  };

  const handleReset = () => {
    setRawData([]);
    setAnalysis(null);
    setFilename('');
    setPendingCSVString(null);
    setErrorMsg('');
    setView('upload');
  };

  const handleErrorMessage = (msg: string) => {
    setView('error');
    setErrorMsg(msg);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onReset={handleReset} hasData={view === 'dashboard'} />

      <main className="flex-1 flex flex-col justify-start pb-16">
        {view === 'upload' && (
          <UploadZone
            onFileSelect={handleFileSelect}
            onSampleSelect={handleSampleSelect}
            onError={handleErrorMessage}
          />
        )}

        {view === 'loading' && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}

        {view === 'error' && (
          <ErrorState message={errorMsg} onRetry={handleReset} />
        )}

        {view === 'dashboard' && rawData.length > 0 && analysis && (
          <Dashboard
            originalData={rawData}
            analysis={analysis}
            filename={filename}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Corporate Dashboard Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Generated in-browser • Rohit's Visualizer
          </span>
          <span className="font-semibold text-slate-500">
            Secure client-side sandbox
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

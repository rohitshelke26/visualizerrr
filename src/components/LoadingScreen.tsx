import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

const STEPS = [
  'Reading CSV dataset',
  'Detecting column type matrices',
  'Calculating aggregation metrics',
  'Mapping dynamic visualizations',
  'Constructing BI dashboard canvas',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length) {
      if (onComplete) {
        // Add a tiny delay for visual gratification before completing
        const timer = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(timer);
      }
      return;
    }

    const intervalTime = activeStep === 0 ? 500 : activeStep === 1 ? 600 : activeStep === 2 ? 700 : activeStep === 3 ? 500 : 400;
    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [activeStep, onComplete]);

  const progressPercent = Math.min((activeStep / STEPS.length) * 100, 100);

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col items-center">
        {/* Spinner/Pulse Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-brand-accent/20 rounded-full animate-ping scale-150 opacity-75"></div>
          <div className="relative bg-brand-accent text-white p-4 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-brand tracking-tight">Analyzing Your Dataset</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium text-center">
          Building your professional Power BI dashboard. Please hold on...
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
          <div
            className="bg-brand-accent h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Steps List */}
        <div className="w-full mt-8 space-y-4">
          {STEPS.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 transition-colors duration-300 ${
                  isCompleted ? 'text-slate-700' : isActive ? 'text-brand-accent' : 'text-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs font-semibold shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-success/10 border-brand-success text-brand-success'
                      : isActive
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-slate-200 text-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span>{index + 1}</span>}
                </div>
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

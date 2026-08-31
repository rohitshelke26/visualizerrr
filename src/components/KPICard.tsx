import React from 'react';
import {
  DollarSign,
  BarChart3,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Hash,
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  changePercent?: number;
  isPositive?: boolean;
  iconName: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'dollar-sign': DollarSign,
  'bar-chart-2': BarChart3,
  users: Users,
  'clipboard-list': ClipboardList,
  'shopping-bag': ShoppingBag,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  hash: Hash,
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  changePercent,
  isPositive,
  iconName,
}) => {
  const IconComponent = ICON_MAP[iconName] || BarChart3;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-shadow duration-200 min-h-[125px]">
      {/* Title & Icon Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[80%]">
          {title}
        </span>
        <div className="text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
          <IconComponent className="w-4 h-4 text-brand-accent" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-extrabold text-brand tracking-tight">
          {value}
        </span>
      </div>

      {/* Comparison/Growth Badges */}
      <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
        {changePercent !== undefined && changePercent !== null && !isNaN(changePercent) ? (
          <>
            <span
              className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[10px] sm:text-xs ${
                isPositive
                  ? 'bg-emerald-50 text-brand-success'
                  : 'bg-red-50 text-brand-danger'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-0.5 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5 shrink-0" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {changePercent.toFixed(1)}%
              </span>
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-light truncate">vs previous period</span>
          </>
        ) : (
          <span className="text-[10px] sm:text-xs text-slate-400 font-light">Overall Aggregation</span>
        )}
      </div>
    </div>
  );
};

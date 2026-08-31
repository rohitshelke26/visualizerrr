import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
} from 'recharts';
import type { ChartDefinition } from '../types/dashboard';
import { formatNumber, truncateLabel } from '../lib/dataFormatter';

interface ChartCardProps {
  chart: ChartDefinition;
  isCurrency?: boolean;
  isPercentage?: boolean;
  currencySymbol?: string;
  isSecondaryCurrency?: boolean;
  isSecondaryPercentage?: boolean;
  secondaryCurrencySymbol?: string;
  heightClass?: string;
  isAnimated?: boolean;
}

const COLORS = [
  '#2563eb', // Cobalt Blue
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#f59e0b', // Amber/Yellow
  '#10b981', // Emerald Green
  '#dc2626', // Red
  '#64748b', // Slate Gray
  '#db2777', // Pink
];

export const ChartCard: React.FC<ChartCardProps> = ({
  chart,
  isCurrency,
  isPercentage,
  currencySymbol,
  isSecondaryCurrency,
  isSecondaryPercentage,
  secondaryCurrencySymbol,
  heightClass,
  isAnimated = true,
}) => {
  const { title, type, xAxisKey, yAxisKey, data, description } = chart;

  // Custom tooltips formatter to display compact currencies and correct symbols
  const formatYValue = (val: any) => {
    if (typeof val !== 'number') return val;
    return formatNumber(val, {
      isCurrency,
      isPercentage,
      currencySymbol,
      compact: false,
    });
  };

  const formatScatterTooltip = (value: any, name: any) => {
    if (name === 'x') {
      return [
        formatNumber(value, {
          isCurrency,
          isPercentage,
          currencySymbol,
          compact: false,
        }),
        xAxisKey.replace(/_/g, ' '),
      ];
    }
    return [
      formatNumber(value, {
        isCurrency: isSecondaryCurrency,
        isPercentage: isSecondaryPercentage,
        currencySymbol: secondaryCurrencySymbol,
        compact: false,
      }),
      yAxisKey.replace(/_/g, ' '),
    ];
  };

  // Custom tick formatter for Y axis to keep charts tidy
  const formatYAxisTick = (val: any) => {
    if (typeof val !== 'number') return val;
    return formatNumber(val, {
      isCurrency,
      isPercentage,
      currencySymbol,
      compact: true,
    });
  };

  // Renders the correct charting canvas based on type
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-light">
          Insufficient data points to map visualization.
        </div>
      );
    }

    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
                width={45}
                dx={-2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                }}
                formatter={formatYValue}
                labelClassName="font-semibold text-slate-700"
              />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorArea)"
                isAnimationActive={isAnimated}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar': // Vertical Bar Chart
      case 'column':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={(val) => truncateLabel(String(val), 10)}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
                width={45}
                dx={-2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px',
                }}
                formatter={formatYValue}
                labelClassName="font-semibold text-slate-700"
              />
              <Bar dataKey={yAxisKey} fill="#2563eb" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={isAnimated} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 15, right: 20, left: 15, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => truncateLabel(String(val), 14)}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px',
                }}
                formatter={formatYValue}
                labelClassName="font-semibold text-slate-700"
              />
              <Bar dataKey={yAxisKey} fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={isAnimated} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                isAnimationActive={isAnimated}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatYValue}
              />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] text-slate-500 font-medium">{truncateLabel(String(value), 10)}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                name={xAxisKey.replace(/_/g, ' ')}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
                dy={10}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yAxisKey.replace(/_/g, ' ')}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  formatNumber(val, {
                    isCurrency: isSecondaryCurrency,
                    isPercentage: isSecondaryPercentage,
                    currencySymbol: secondaryCurrencySymbol,
                    compact: true,
                  })
                }
                width={45}
                dx={-2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatScatterTooltip}
              />
              <Scatter name="Data point" data={data} fill="#0d9488" opacity={0.7} isAnimationActive={isAnimated} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey={xAxisKey} tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 8 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatYValue}
              />
              <Radar
                name={yAxisKey.replace(/_/g, ' ')}
                dataKey={yAxisKey}
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.4}
                isAnimationActive={isAnimated}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={(val) => truncateLabel(String(val), 10)}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
                width={45}
                dx={-2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={(value: any, name: any) => {
                  const isSec = name === 'secondaryValue';
                  return [
                    formatNumber(value, {
                      isCurrency: isSec ? isSecondaryCurrency : isCurrency,
                      isPercentage: isSec ? isSecondaryPercentage : isPercentage,
                      currencySymbol: isSec ? secondaryCurrencySymbol : currencySymbol,
                      compact: false,
                    }),
                    isSec ? (chart.yAxisKeySecondary || 'Secondary Metric').replace(/_/g, ' ') : yAxisKey.replace(/_/g, ' ')
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={32}
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] text-slate-500 font-medium capitalize">
                    {value === 'secondaryValue' 
                      ? (chart.yAxisKeySecondary || 'Secondary Metric').replace(/_/g, ' ') 
                      : yAxisKey.replace(/_/g, ' ')}
                  </span>
                )}
              />
              <Bar dataKey={yAxisKey} fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={isAnimated} />
              <Line type="monotone" dataKey="secondaryValue" stroke="#ff7300" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={isAnimated} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between ${heightClass || 'h-[340px]'}`}>
      <div>
        <h4 className="font-bold text-sm text-slate-700 tracking-tight capitalize">
          {title}
        </h4>
        {description && (
          <p className="text-[10px] text-slate-400 mt-0.5 font-light leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex-1 relative w-full min-h-0 mt-3">
        {renderChart()}
      </div>
    </div>
  );
};

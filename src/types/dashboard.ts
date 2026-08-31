
export interface KPIResult {
  title: string;
  value: string;
  rawVal: number;
  changePercent?: number; // growth compared to previous half or period
  isPositive?: boolean;
  icon: string;
  columnName: string;
}

export interface ChartDefinition {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'column' | 'donut' | 'scatter' | 'horizontal-bar' | 'area' | 'radar' | 'composed';
  xAxisKey: string;
  yAxisKey: string;
  yAxisKeySecondary?: string; // e.g. for dual metrics
  data: any[];
  description?: string;
}

export interface FilterDefinition {
  columnName: string;
  displayName: string;
  options: string[];
  selectedValues: string[]; // empty means "All"
}

export interface DateFilterValue {
  preset: 'all' | 'today' | 'this-month' | 'this-quarter' | 'this-year' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface ActiveFilters {
  categorical: Record<string, string[]>;
  date?: DateFilterValue;
}

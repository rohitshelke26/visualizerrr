export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean' | 'text' | 'id';

export interface NumericStats {
  sum: number;
  average: number;
  min: number;
  max: number;
  median: number;
  count: number;
  missingCount: number;
}

export interface CategoryFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface CategoricalStats {
  uniqueCount: number;
  frequencies: CategoryFrequency[];
  topCategories: CategoryFrequency[];
}

export interface DateStats {
  min: string;
  max: string;
  frequency: 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'unknown';
  uniqueCount: number;
}

export interface ColumnMetadata {
  name: string;
  type: ColumnType;
  missingCount: number;
  numericStats?: NumericStats;
  categoricalStats?: CategoricalStats;
  dateStats?: DateStats;
  isCurrency?: boolean;
  isPercentage?: boolean;
  currencySymbol?: string;
}

export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: ColumnMetadata[];
  primaryMetric: string;
  secondaryMetrics: string[];
  primaryDimension: string;
  secondaryDimensions: string[];
  missingValuesTotal: number;
}

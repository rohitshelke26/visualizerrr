import type { ColumnMetadata, ColumnType, DatasetAnalysis, DateStats, CategoryFrequency } from '../types/dataset';

// Basic date detection regexes
const DATE_REGEXES = [
  /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
  /^\d{4}\/\d{2}\/\d{2}$/,                    // YYYY/MM/DD
  /^\d{2}-\d{2}-\d{4}$/,                    // DD-MM-YYYY or MM-DD-YYYY
  /^\d{2}\/\d{2}\/\d{4}$/,                    // DD/MM/YYYY or MM/DD/YYYY
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,   // ISO timestamp
  /^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}$/        // Mon DD, YYYY
];

function isDateString(val: any): boolean {
  if (typeof val !== 'string') return false;
  const str = val.trim();
  if (str.length < 6 || str.length > 30) return false;
  // Make sure it doesn't look like a simple number
  if (/^\d+$/.test(str)) return false;
  
  if (DATE_REGEXES.some(regex => regex.test(str))) return true;

  // Fallback to Date.parse, but ensure it's not a pure number being converted
  const parsed = Date.parse(str);
  return !isNaN(parsed) && isNaN(Number(str)) && str.includesAny(['/', '-', ' ', ',']);
}

// Extension check helper to see if separator exists
const originalIncludes = String.prototype.includes;
String.prototype.includesAny = function (chars: string[]): boolean {
  return chars.some(char => originalIncludes.call(this, char));
};

declare global {
  interface String {
    includesAny(chars: string[]): boolean;
  }
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function analyzeDataset(
  data: Record<string, any>[],
  headers: string[],
  inferredMetaData: Record<string, { isCurrency: boolean; isPercentage: boolean; currencySymbol?: string }>
): DatasetAnalysis {
  const rowCount = data.length;
  const columnCount = headers.length;
  let missingValuesTotal = 0;

  const columns: ColumnMetadata[] = headers.map((header) => {
    let missingCount = 0;
    let nonNullValues: any[] = [];

    // Collect values for profiling
    data.forEach((row) => {
      const val = row[header];
      if (val === null || val === undefined || val === '') {
        missingCount++;
      } else {
        nonNullValues.push(val);
      }
    });

    missingValuesTotal += missingCount;

    // Detect column type based on non-null samples
    let type: ColumnType = 'text';
    const sampleValues = nonNullValues.slice(0, 100);
    const nonNullCount = nonNullValues.length;

    if (nonNullCount === 0) {
      type = 'text';
    } else {
      const isAllNumeric = sampleValues.every((val) => typeof val === 'number');
      const isAllBoolean = sampleValues.every((val) => typeof val === 'boolean' || val === 1 || val === 0 || val === '1' || val === '0');
      const isAllDate = sampleValues.every((val) => isDateString(val) || val instanceof Date);

      if (isAllNumeric) {
        // Double check if it behaves like boolean (only 0 and 1, low unique count)
        const uniqueSamples = new Set(sampleValues);
        if (uniqueSamples.size <= 2 && Array.from(uniqueSamples).every(v => v === 0 || v === 1)) {
          type = 'boolean';
        } else {
          // If the header looks like an ID (e.g. Employee ID, Order ID) and cardinality is high
          const lowercaseHeader = header.toLowerCase();
          const isIdLikeName = lowercaseHeader.includesAny(['id', 'key', 'code', 'number', 'num']);
          const fullUniqueCount = new Set(nonNullValues).size;
          if (isIdLikeName && fullUniqueCount > 30 && fullUniqueCount > rowCount * 0.5) {
            type = 'id';
          } else {
            type = 'numeric';
          }
        }
      } else if (isAllDate) {
        type = 'date';
      } else if (isAllBoolean) {
        type = 'boolean';
      } else {
        // String classification
        const uniqueValues = new Set(nonNullValues);
        const uniqueCount = uniqueValues.size;
        const lowercaseHeader = header.toLowerCase();
        const isIdLikeName = lowercaseHeader.includesAny(['id', 'key', 'code', 'number', 'num']);

        if (isIdLikeName && uniqueCount > 30 && uniqueCount > rowCount * 0.5) {
          type = 'id';
        } else if (uniqueCount <= 35 || uniqueCount < rowCount * 0.2) {
          type = 'categorical';
        } else {
          type = 'text';
        }
      }
    }

    const metadata: ColumnMetadata = {
      name: header,
      type,
      missingCount,
      isCurrency: inferredMetaData[header]?.isCurrency || false,
      isPercentage: inferredMetaData[header]?.isPercentage || false,
      currencySymbol: inferredMetaData[header]?.currencySymbol,
    };

    // Calculate aggregations based on type
    if (type === 'numeric') {
      const nums = nonNullValues as number[];
      const sum = nums.reduce((acc, curr) => acc + curr, 0);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const average = nums.length > 0 ? sum / nums.length : 0;
      const median = calculateMedian(nums);

      metadata.numericStats = {
        sum,
        average,
        min,
        max,
        median,
        count: nums.length,
        missingCount,
      };
    } else if (type === 'categorical' || type === 'boolean') {
      const valCounts: Record<string, number> = {};
      nonNullValues.forEach((val) => {
        const strVal = String(val);
        valCounts[strVal] = (valCounts[strVal] || 0) + 1;
      });

      const frequencies: CategoryFrequency[] = Object.entries(valCounts).map(([value, count]) => ({
        value,
        count,
        percentage: nonNullValues.length > 0 ? (count / nonNullValues.length) * 100 : 0,
      })).sort((a, b) => b.count - a.count);

      metadata.categoricalStats = {
        uniqueCount: frequencies.length,
        frequencies,
        topCategories: frequencies.slice(0, 15),
      };
    } else if (type === 'date') {
      const dates = nonNullValues.map((val) => {
        if (val instanceof Date) return val;
        return new Date(val);
      }).filter((d) => !isNaN(d.getTime()));

      const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
      const uniqueCount = new Set(nonNullValues).size;

      // Determine date frequency spacing
      let frequency: DateStats['frequency'] = 'unknown';
      if (dates.length >= 2) {
        const diffs: number[] = [];
        const sortedDates = dates.map(d => d.getTime()).sort((a, b) => a - b);
        for (let i = 1; i < Math.min(sortedDates.length, 50); i++) {
          diffs.push(sortedDates[i] - sortedDates[i - 1]);
        }
        const avgDiffMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (avgDiffMs < oneDayMs * 1.5) {
          frequency = 'daily';
        } else if (avgDiffMs < oneDayMs * 15) {
          frequency = 'unknown'; // likely bi-weekly or weekly
        } else if (avgDiffMs < oneDayMs * 35) {
          frequency = 'monthly';
        } else if (avgDiffMs < oneDayMs * 100) {
          frequency = 'quarterly';
        } else {
          frequency = 'yearly';
        }
      }

      metadata.dateStats = {
        min: minDate.toISOString().split('T')[0],
        max: maxDate.toISOString().split('T')[0],
        frequency,
        uniqueCount,
      };
    }

    return metadata;
  });

  // Step 3: Classify Primary/Secondary Metrics and Dimensions for Dashboard layout
  const numericCols = columns.filter((col) => col.type === 'numeric');
  const categoricalCols = columns.filter((col) => col.type === 'categorical' || col.type === 'boolean');
  const dateCols = columns.filter((col) => col.type === 'date');

  let primaryMetric = '';
  const secondaryMetrics: string[] = [];

  // Score numeric columns to find the most relevant business metric
  if (numericCols.length > 0) {
    const metricPriorityList = ['revenue', 'sales', 'profit', 'amount', 'income', 'cost', 'sales_amount', 'total_amount', 'quantity', 'count'];
    let bestMetricCol = numericCols[0].name;
    let highestPriority = Infinity;

    numericCols.forEach((col) => {
      const lowercaseName = col.name.toLowerCase();
      const priorityIndex = metricPriorityList.findIndex(p => lowercaseName.includes(p));
      if (priorityIndex !== -1 && priorityIndex < highestPriority) {
        highestPriority = priorityIndex;
        bestMetricCol = col.name;
      }
    });

    primaryMetric = bestMetricCol;
    numericCols.forEach((col) => {
      if (col.name !== primaryMetric) {
        secondaryMetrics.push(col.name);
      }
    });
  }

  let primaryDimension = '';
  const secondaryDimensions: string[] = [];

  // Prioritize dates first as main dimension, then categorical fields
  if (dateCols.length > 0) {
    primaryDimension = dateCols[0].name;
    dateCols.slice(1).forEach(col => secondaryDimensions.push(col.name));
    categoricalCols.forEach(col => secondaryDimensions.push(col.name));
  } else if (categoricalCols.length > 0) {
    // Choose category with reasonable unique count, like 3 to 15 (e.g. Product, Category, Region)
    let bestDim = categoricalCols[0].name;
    let bestUniqueCountDiff = Infinity; // distance from 6

    categoricalCols.forEach((col) => {
      const count = col.categoricalStats?.uniqueCount || 0;
      const lowercaseName = col.name.toLowerCase();
      
      // Bonus if it's named product/category/region
      const isReentrantName = lowercaseName.includesAny(['product', 'category', 'region', 'segment', 'department']);
      const distance = Math.abs(count - 6);
      const score = distance - (isReentrantName ? 5 : 0);

      if (score < bestUniqueCountDiff) {
        bestUniqueCountDiff = score;
        bestDim = col.name;
      }
    });

    primaryDimension = bestDim;
    categoricalCols.forEach((col) => {
      if (col.name !== primaryDimension) {
        secondaryDimensions.push(col.name);
      }
    });
  }

  return {
    rowCount,
    columnCount,
    columns,
    primaryMetric,
    secondaryMetrics,
    primaryDimension,
    secondaryDimensions,
    missingValuesTotal,
  };
}

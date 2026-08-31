import type { DatasetAnalysis } from '../types/dataset';
import type { ChartDefinition } from '../types/dashboard';

// Helper to group and aggregate data by category
function aggregateByCategory(
  data: Record<string, any>[],
  dimensionName: string,
  metricName: string,
  options?: { topN?: number; limit?: number }
): any[] {
  const { topN = 10, limit = 15 } = options || {};
  const groups: Record<string, { sum: number; count: number }> = {};

  data.forEach((row) => {
    const dimVal = row[dimensionName] === null || row[dimensionName] === undefined ? 'Unknown' : String(row[dimensionName]);
    const metricVal = Number(row[metricName]) || 0;

    if (!groups[dimVal]) {
      groups[dimVal] = { sum: 0, count: 0 };
    }
    groups[dimVal].sum += metricVal;
    groups[dimVal].count += 1;
  });

  let aggregated = Object.entries(groups).map(([name, stats]) => ({
    name,
    value: parseFloat(stats.sum.toFixed(2)),
    average: parseFloat((stats.sum / stats.count).toFixed(2)),
  }));

  // Sort descending by sum
  aggregated.sort((a, b) => b.value - a.value);

  // Apply Top N grouping
  if (aggregated.length > limit) {
    const topItems = aggregated.slice(0, topN);
    const otherItems = aggregated.slice(topN);
    const otherSum = otherItems.reduce((acc, curr) => acc + curr.value, 0);
    const otherAvg = otherItems.reduce((acc, curr) => acc + curr.average, 0) / otherItems.length;

    return [
      ...topItems,
      {
        name: 'Other',
        value: parseFloat(otherSum.toFixed(2)),
        average: parseFloat(otherAvg.toFixed(2)),
      },
    ];
  }

  return aggregated;
}


// Helper to aggregate dual metrics for Composed (Line + Bar) Chart
function aggregateForComposed(
  data: Record<string, any>[],
  dimensionName: string,
  primaryMetric: string,
  secondaryMetric: string,
  options?: { topN?: number; limit?: number }
): any[] {
  const { topN = 10, limit = 15 } = options || {};
  const groups: Record<string, { primarySum: number; secondarySum: number }> = {};

  data.forEach((row) => {
    const dimVal = row[dimensionName] === null || row[dimensionName] === undefined ? 'Unknown' : String(row[dimensionName]);
    const primVal = Number(row[primaryMetric]) || 0;
    const secVal = Number(row[secondaryMetric]) || 0;

    if (!groups[dimVal]) {
      groups[dimVal] = { primarySum: 0, secondarySum: 0 };
    }
    groups[dimVal].primarySum += primVal;
    groups[dimVal].secondarySum += secVal;
  });

  let aggregated = Object.entries(groups).map(([name, stats]) => ({
    name,
    value: parseFloat(stats.primarySum.toFixed(2)),
    secondaryValue: parseFloat(stats.secondarySum.toFixed(2)),
  }));

  aggregated.sort((a, b) => b.value - a.value);

  if (aggregated.length > limit) {
    const topItems = aggregated.slice(0, topN);
    const otherItems = aggregated.slice(topN);
    const otherPrimSum = otherItems.reduce((acc, curr) => acc + curr.value, 0);
    const otherSecSum = otherItems.reduce((acc, curr) => acc + curr.secondaryValue, 0);

    return [
      ...topItems,
      {
        name: 'Other',
        value: parseFloat(otherPrimSum.toFixed(2)),
        secondaryValue: parseFloat(otherSecSum.toFixed(2)),
      },
    ];
  }

  return aggregated;
}

// Helper to extract date key depending on frequency range
function getDateKey(dateStr: string, frequency: string): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';

  const year = date.getFullYear();
  const monthName = date.toLocaleString('default', { month: 'short' });

  if (frequency === 'yearly') {
    return `${year}`;
  }
  if (frequency === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
  }
  if (frequency === 'monthly') {
    return `${monthName} ${year}`;
  }
  return dateStr; // default to daily (YYYY-MM-DD)
}

// Helper to group and aggregate data by date
function aggregateByDate(
  data: Record<string, any>[],
  dateColName: string,
  metricName: string,
  frequency: string
): any[] {
  const groups: Record<string, { sum: number; count: number; sortKey: string }> = {};

  data.forEach((row) => {
    const rawDateVal = row[dateColName];
    if (!rawDateVal) return;

    const dateStr = typeof rawDateVal === 'string' ? rawDateVal : new Date(rawDateVal).toISOString().split('T')[0];
    const key = getDateKey(dateStr, frequency);
    
    // Sort key helps to sort chronologically (since Month Name like "Jan" will sort alphabetically otherwise)
    const dateObj = new Date(dateStr);
    const sortKey = isNaN(dateObj.getTime()) ? '0' : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    const metricVal = Number(row[metricName]) || 0;

    if (!groups[key]) {
      groups[key] = { sum: 0, count: 0, sortKey };
    }
    groups[key].sum += metricVal;
    groups[key].count += 1;
  });

  return Object.entries(groups)
    .map(([name, stats]) => ({
      name,
      value: parseFloat(stats.sum.toFixed(2)),
      average: parseFloat((stats.sum / stats.count).toFixed(2)),
      sortKey: stats.sortKey,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function selectCharts(
  data: Record<string, any>[],
  analysis: DatasetAnalysis
): ChartDefinition[] {
  const charts: ChartDefinition[] = [];
  const primaryMetric = analysis.primaryMetric;
  if (!primaryMetric || data.length === 0) return [];

  const dateCols = analysis.columns.filter((c) => c.type === 'date');
  const categoricalCols = analysis.columns.filter((c) => c.type === 'categorical' || c.type === 'boolean');
  const numericCols = analysis.columns.filter((c) => c.type === 'numeric');

  const mainDateCol = dateCols[0];
  const mainCatCol = categoricalCols[0];

  // 1. Time Series Chart (Line/Area)
  if (mainDateCol) {
    const freq = mainDateCol.dateStats?.frequency || 'monthly';
    const chartData = aggregateByDate(data, mainDateCol.name, primaryMetric, freq);

    charts.push({
      id: 'time-series',
      title: `${primaryMetric.replace(/_/g, ' ')} Trend over Time`,
      type: 'area',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Historical analysis grouped by ${freq} interval.`,
    });
  }

  // 2. Category Comparison (Vertical Bar Chart)
  if (mainCatCol) {
    const chartData = aggregateByCategory(data, mainCatCol.name, primaryMetric, { topN: 10, limit: 15 });
    charts.push({
      id: 'category-comparison',
      title: `${primaryMetric.replace(/_/g, ' ')} by ${mainCatCol.name.replace(/_/g, ' ')}`,
      type: 'bar',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Comparison of top elements in ${mainCatCol.name}.`,
    });
  }

  // 3. Regional / Segment Analysis (Column/Bar Chart)
  const secondaryCatCol = categoricalCols.find((c) => c.name !== mainCatCol?.name);
  if (secondaryCatCol) {
    const chartData = aggregateByCategory(data, secondaryCatCol.name, primaryMetric, { topN: 8, limit: 10 });
    charts.push({
      id: 'segment-analysis',
      title: `${primaryMetric.replace(/_/g, ' ')} by ${secondaryCatCol.name.replace(/_/g, ' ')}`,
      type: 'column',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Distribution of primary measure across ${secondaryCatCol.name}.`,
    });
  }

  // 4. Composition (Pie / Donut Chart)
  // Look for a category with 2 to 6 unique values
  const donutCat = categoricalCols.find((c) => {
    const uniqueCount = c.categoricalStats?.uniqueCount || 0;
    return uniqueCount >= 2 && uniqueCount <= 6;
  });
  if (donutCat) {
    const chartData = aggregateByCategory(data, donutCat.name, primaryMetric);
    charts.push({
      id: 'composition-donut',
      title: `${primaryMetric.replace(/_/g, ' ')} Distribution by ${donutCat.name.replace(/_/g, ' ')}`,
      type: 'donut',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Composition breakdown across ${donutCat.name} segments.`,
    });
  }

  // 5. Profit / Secondary Metric vs Main Category (Dual bar or line comparison)
  const secondaryMetric = analysis.secondaryMetrics[0];
  if (secondaryMetric && mainCatCol) {
    const chartData = aggregateByCategory(data, mainCatCol.name, secondaryMetric, { topN: 10, limit: 15 });
    charts.push({
      id: 'secondary-metric-chart',
      title: `${secondaryMetric.replace(/_/g, ' ')} by ${mainCatCol.name.replace(/_/g, ' ')}`,
      type: 'bar',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Analysis of secondary performance metric: ${secondaryMetric}.`,
    });
  }

  // 6. Scatter Plot (Sales vs Profit, or Sales vs Quantity)
  const anotherNumeric = numericCols.find((c) => c.name !== primaryMetric);
  if (anotherNumeric) {
    // Collect sample of max 200 scatter points to avoid chart sluggishness
    const scatterSample = data
      .filter((row) => row[primaryMetric] !== null && row[anotherNumeric.name] !== null)
      .slice(0, 200)
      .map((row) => ({
        x: row[primaryMetric],
        y: row[anotherNumeric.name],
        name: mainCatCol ? row[mainCatCol.name] || 'N/A' : 'Record',
      }));

    charts.push({
      id: 'scatter-plot',
      title: `${primaryMetric.replace(/_/g, ' ')} vs ${anotherNumeric.name.replace(/_/g, ' ')}`,
      type: 'scatter',
      xAxisKey: 'x',
      yAxisKey: 'y',
      data: scatterSample,
      description: `Correlation matrix between ${primaryMetric} and ${anotherNumeric.name}.`,
    });
  }

  // 7. Top 10 High Cardinality Horizontal Bar Chart
  const highCardCat = categoricalCols.find((c) => {
    const count = c.categoricalStats?.uniqueCount || 0;
    return count > 10;
  });
  if (highCardCat) {
    const chartData = aggregateByCategory(data, highCardCat.name, primaryMetric, { topN: 10, limit: 10 });
    charts.push({
      id: 'top-10-ranking',
      title: `Top 10 ${highCardCat.name.replace(/_/g, ' ')}s by ${primaryMetric.replace(/_/g, ' ')}`,
      type: 'horizontal-bar',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Ranking of top performing ${highCardCat.name} groups.`,
    });
  }
  
  // 8. Radar Chart (Spider comparison)
  if (mainCatCol) {
    const chartData = aggregateByCategory(data, mainCatCol.name, primaryMetric, { topN: 6, limit: 8 });
    charts.push({
      id: 'radar-chart',
      title: `${primaryMetric.replace(/_/g, ' ')} Radar by ${mainCatCol.name.replace(/_/g, ' ')}`,
      type: 'radar',
      xAxisKey: 'name',
      yAxisKey: 'value',
      data: chartData,
      description: `Radar spider breakdown for ${mainCatCol.name}.`,
    });
  }

  // 9. Composed Line & Bar Chart (Dual measure analysis)
  if (secondaryMetric && mainCatCol) {
    const chartData = aggregateForComposed(data, mainCatCol.name, primaryMetric, secondaryMetric, { topN: 10, limit: 12 });
    charts.push({
      id: 'composed-chart',
      title: `${primaryMetric.replace(/_/g, ' ')} & ${secondaryMetric.replace(/_/g, ' ')} Combo Chart`,
      type: 'composed',
      xAxisKey: 'name',
      yAxisKey: 'value',
      yAxisKeySecondary: 'secondaryValue',
      data: chartData,
      description: `Primary metric (Bar) and secondary metric (Line) comparison.`,
    });
  }


  // Fallback charts: If we have less than 6 charts, generate charts using secondary columns
  if (charts.length < 6) {
    // If we have other numerical measures, compare them by creating a metric comparisons chart
    const remainingCatCols = categoricalCols.filter(col => !charts.some(c => c.xAxisKey === col.name || c.id.includes(col.name)));
    remainingCatCols.forEach((col) => {
      if (charts.length >= 7) return;
      const chartData = aggregateByCategory(data, col.name, primaryMetric, { topN: 10, limit: 15 });
      charts.push({
        id: `fallback-${col.name}`,
        title: `${primaryMetric.replace(/_/g, ' ')} by ${col.name.replace(/_/g, ' ')}`,
        type: 'bar',
        xAxisKey: 'name',
        yAxisKey: 'value',
        data: chartData,
        description: `Breakdown by ${col.name}.`,
      });
    });
  }

  return charts;
}

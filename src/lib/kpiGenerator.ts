import type { DatasetAnalysis } from '../types/dataset';
import type { KPIResult } from '../types/dashboard';
import { formatNumber } from './dataFormatter';

export function generateKPIs(
  data: Record<string, any>[],
  analysis: DatasetAnalysis
): KPIResult[] {
  const kpis: KPIResult[] = [];
  if (data.length === 0) return [];

  // Determine if a date column is available for trends
  const dateCol = analysis.columns.find((col) => col.type === 'date');
  let sortedData = [...data];
  
  if (dateCol) {
    sortedData.sort((a, b) => {
      const dateA = a[dateCol.name] ? new Date(a[dateCol.name]).getTime() : 0;
      const dateB = b[dateCol.name] ? new Date(b[dateCol.name]).getTime() : 0;
      return dateA - dateB;
    });
  }

  const halfIndex = Math.floor(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, halfIndex);
  const secondHalf = sortedData.slice(halfIndex);

  // Helper to calculate numeric growth trend
  function getTrend(colName: string, isAverage: boolean = false): { pct?: number; isPositive?: boolean } {
    if (sortedData.length < 10) return {}; // Need reasonable sample size

    const sumVal = (arr: any[]) => arr.reduce((acc, curr) => acc + (Number(curr[colName]) || 0), 0);
    
    let val1 = sumVal(firstHalf);
    let val2 = sumVal(secondHalf);

    if (isAverage) {
      val1 = firstHalf.length > 0 ? val1 / firstHalf.length : 0;
      val2 = secondHalf.length > 0 ? val2 / secondHalf.length : 0;
    }

    if (val1 === 0) return {};
    const pct = ((val2 - val1) / val1) * 100;
    return {
      pct: parseFloat(pct.toFixed(1)),
      isPositive: pct >= 0,
    };
  }

  // 1. Primary Metric (e.g. Sales, Revenue) - SUM
  if (analysis.primaryMetric) {
    const colName = analysis.primaryMetric;
    const colMeta = analysis.columns.find((col) => col.name === colName);
    const totalSum = data.reduce((acc, curr) => acc + (Number(curr[colName]) || 0), 0);
    const trend = getTrend(colName, false);

    kpis.push({
      title: `TOTAL ${colName.toUpperCase().replace(/_/g, ' ')}`,
      value: formatNumber(totalSum, {
        isCurrency: colMeta?.isCurrency,
        isPercentage: colMeta?.isPercentage,
        currencySymbol: colMeta?.isCurrency ? '$' : undefined,
        compact: true,
      }),
      rawVal: totalSum,
      changePercent: trend.pct,
      isPositive: trend.isPositive,
      icon: colMeta?.isCurrency ? 'dollar-sign' : 'bar-chart-2',
      columnName: colName,
    });
  }

  // 2. Secondary Metrics - e.g., Profit (SUM) or Quantity (SUM)
  const secondaryNumericCols = analysis.secondaryMetrics.slice(0, 3);
  secondaryNumericCols.forEach((colName) => {
    const colMeta = analysis.columns.find((col) => col.name === colName);
    if (!colMeta) return;

    const totalSum = data.reduce((acc, curr) => acc + (Number(curr[colName]) || 0), 0);
    const isAverage = colName.toLowerCase().includes('avg') || colName.toLowerCase().includes('rate') || colName.toLowerCase().includes('price');
    
    let calculatedVal = totalSum;
    if (isAverage) {
      const validRows = data.filter((row) => row[colName] !== null && row[colName] !== undefined);
      calculatedVal = validRows.length > 0 ? totalSum / validRows.length : 0;
    }

    const trend = getTrend(colName, isAverage);

    // Pick a sensible icon
    let icon = 'hash';
    if (colMeta.isCurrency) icon = 'dollar-sign';
    else if (colName.toLowerCase().includes('quantity') || colName.toLowerCase().includes('qty')) icon = 'shopping-bag';
    else if (colName.toLowerCase().includes('profit')) icon = 'trending-up';

    kpis.push({
      title: `${isAverage ? 'AVG' : 'TOTAL'} ${colName.toUpperCase().replace(/_/g, ' ')}`,
      value: formatNumber(calculatedVal, {
        isCurrency: colMeta.isCurrency,
        isPercentage: colMeta.isPercentage,
        currencySymbol: colMeta.isCurrency ? '$' : undefined,
        compact: true,
      }),
      rawVal: calculatedVal,
      changePercent: trend.pct,
      isPositive: trend.isPositive,
      icon,
      columnName: colName,
    });
  });

  // 3. ID-like field (e.g. Customers, Transactions) or simple Row Count
  const idCol = analysis.columns.find((col) => col.type === 'id');
  if (idCol && kpis.length < 4) {
    const uniqueIds = new Set(data.map((row) => row[idCol.name]).filter(Boolean));
    kpis.push({
      title: `UNIQUE ${idCol.name.toUpperCase().replace(/_/g, ' ')}`,
      value: formatNumber(uniqueIds.size, { compact: true }),
      rawVal: uniqueIds.size,
      icon: 'users',
      columnName: idCol.name,
    });
  }

  // 4. Fallback/Support KPI - Record count
  if (kpis.length < 4) {
    // If we need another KPI, do Average Order/Item Value if primary metric & quantity exists
    const qtyCol = analysis.columns.find((col) => col.name.toLowerCase().includesAny(['quantity', 'qty']));
    if (analysis.primaryMetric && qtyCol && kpis.find(k => k.columnName === qtyCol.name)) {
      const salesSum = data.reduce((acc, curr) => acc + (Number(curr[analysis.primaryMetric]) || 0), 0);
      const qtySum = data.reduce((acc, curr) => acc + (Number(curr[qtyCol.name]) || 0), 0);
      const aov = qtySum > 0 ? salesSum / qtySum : 0;
      
      const pMeta = analysis.columns.find((col) => col.name === analysis.primaryMetric);

      kpis.push({
        title: 'AVG VALUE PER ITEM',
        value: formatNumber(aov, {
          isCurrency: pMeta?.isCurrency,
          currencySymbol: pMeta?.isCurrency ? '$' : undefined,
          compact: true,
        }),
        rawVal: aov,
        icon: 'credit-card',
        columnName: analysis.primaryMetric,
      });
    } else {
      // General count of records
      kpis.push({
        title: 'TOTAL TRANSACTIONS',
        value: formatNumber(data.length, { compact: false }),
        rawVal: data.length,
        icon: 'clipboard-list',
        columnName: '',
      });
    }
  }

  // Cap at 4 KPIs to maintain visual balance
  return kpis.slice(0, 4);
}

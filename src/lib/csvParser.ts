import Papa from 'papaparse';

export interface CleanedCSV {
  data: Record<string, any>[];
  headers: string[];
  inferredMetaData: Record<string, { isCurrency: boolean; isPercentage: boolean; currencySymbol?: string }>;
  errors: string[];
}

// Helper to clean currency symbols, commas, and percentage signs from strings
export function cleanNumericString(val: string): { cleaned: string; isCurrency: boolean; isPercentage: boolean; currencySymbol?: string } {
  let cleaned = val.trim();
  let isCurrency = false;
  let isPercentage = false;
  let currencySymbol: string | undefined = undefined;

  if (!cleaned) {
    return { cleaned, isCurrency, isPercentage };
  }

  // Check currency
  const currencyRegex = /^([\$₹€£¥])\s*(-?[\d,]+\.?\d*)|(-?[\d,]+\.?\d*)\s*([\$₹€£¥])$/;
  const match = cleaned.match(currencyRegex);
  if (match) {
    isCurrency = true;
    currencySymbol = match[1] || match[4];
    cleaned = cleaned.replace(/[\$₹€£¥,]/g, '');
  } else if (/^-?[\$₹€£¥]\s*[\d,]+/g.test(cleaned) || /[\d,]+\s*[\$₹€£¥]/g.test(cleaned)) {
    isCurrency = true;
    cleaned = cleaned.replace(/[\$₹€£¥,]/g, '');
  }

  // Check percentage
  if (cleaned.endsWith('%')) {
    isPercentage = true;
    cleaned = cleaned.slice(0, -1).replace(/,/g, '');
  }

  // If normal number with commas, strip commas
  if (/^-?[\d,]+\.?\d*$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  }

  return { cleaned, isCurrency, isPercentage, currencySymbol };
}

export function parseCSV(csvString: string): CleanedCSV {
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const errors: string[] = [];
  if (parsed.errors.length > 0) {
    parsed.errors.forEach((err) => {
      errors.push(`${err.type}: ${err.message} at row ${err.row}`);
    });
  }

  const rawData = parsed.data as Record<string, string>[];
  if (rawData.length === 0) {
    return { data: [], headers: [], inferredMetaData: {}, errors: ['The CSV file is empty.'] };
  }

  const headers = parsed.meta.fields || Object.keys(rawData[0]);
  const inferredMetaData: Record<string, { isCurrency: boolean; isPercentage: boolean; currencySymbol?: string }> = {};

  // Initialize meta trackers
  headers.forEach((header) => {
    inferredMetaData[header] = { isCurrency: false, isPercentage: false };
  });

  // Step 1: Detect column formatting from first few rows
  const sampleSize = Math.min(rawData.length, 100);
  headers.forEach((header) => {
    let currencyCount = 0;
    let percentageCount = 0;
    let symbolCount: Record<string, number> = {};
    let nonBgCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = rawData[i][header];
      if (val !== undefined && val !== null && val.trim() !== '') {
        nonBgCount++;
        const info = cleanNumericString(val);
        if (info.isCurrency) {
          currencyCount++;
          if (info.currencySymbol) {
            symbolCount[info.currencySymbol] = (symbolCount[info.currencySymbol] || 0) + 1;
          }
        }
        if (info.isPercentage) {
          percentageCount++;
        }
      }
    }

    if (nonBgCount > 0) {
      const currencyRatio = currencyCount / nonBgCount;
      const percentageRatio = percentageCount / nonBgCount;

      if (currencyRatio > 0.5) {
        inferredMetaData[header].isCurrency = true;
        // Find dominant symbol
        let maxSym = '$';
        let maxCount = 0;
        Object.entries(symbolCount).forEach(([sym, cnt]) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            maxSym = sym;
          }
        });
        inferredMetaData[header].currencySymbol = maxSym;
      } else if (percentageRatio > 0.5) {
        inferredMetaData[header].isPercentage = true;
      }
    }
  });

  // Step 2: Clean values and convert types
  const cleanedData = rawData.map((row) => {
    const cleanedRow: Record<string, any> = {};
    headers.forEach((header) => {
      const rawVal = row[header];
      if (rawVal === undefined || rawVal === null || rawVal.trim() === '') {
        cleanedRow[header] = null;
        return;
      }

      const trimmedVal = rawVal.trim();

      // Try numeric parsing
      const { cleaned } = cleanNumericString(trimmedVal);
      const parsedNum = Number(cleaned);

      if (!isNaN(parsedNum) && cleaned !== '') {
        // If it was percentage, we can store as decimal or full percentage
        // Let's store raw number (e.g. "12.5" is stored as 12.5)
        cleanedRow[header] = parsedNum;
      } else if (trimmedVal.toLowerCase() === 'true' || trimmedVal.toLowerCase() === 'yes') {
        cleanedRow[header] = true;
      } else if (trimmedVal.toLowerCase() === 'false' || trimmedVal.toLowerCase() === 'no') {
        cleanedRow[header] = false;
      } else {
        cleanedRow[header] = trimmedVal;
      }
    });
    return cleanedRow;
  });

  return {
    data: cleanedData,
    headers,
    inferredMetaData,
    errors,
  };
}

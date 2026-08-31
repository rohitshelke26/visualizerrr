export function formatNumber(
  value: number | null | undefined,
  options?: {
    isCurrency?: boolean;
    isPercentage?: boolean;
    currencySymbol?: string;
    compact?: boolean;
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  const { isCurrency = false, isPercentage = false, currencySymbol = '$', compact = false } = options || {};

  // Handle percentages
  if (isPercentage) {
    // If the numbers look like ratios (average is small), multiply by 100
    // But since this is a general formatter, we'll assume the parsed value is already a percentage (like 12.5 for 12.5%)
    // If the value is very small (< 1) and user requests percentage, we might multiply by 100 depending on use case.
    // Let's assume values are ready percentages or multiply if absolute value is < 1.0. Let's keep it simple:
    return `${value.toFixed(1).replace(/\.0$/, '')}%`;
  }

  const symbol = currencySymbol || '$';
  const isINR = symbol === '₹' || currencySymbol === 'INR';

  if (compact) {
    const absVal = Math.abs(value);
    if (isINR) {
      // Indian compact format: Crores (Cr) and Lakhs (L)
      if (absVal >= 10000000) {
        return `${value < 0 ? '-' : ''}${symbol}${(absVal / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
      }
      if (absVal >= 100000) {
        return `${value < 0 ? '-' : ''}${symbol}${(absVal / 100000).toFixed(2).replace(/\.00$/, '')}L`;
      }
      if (absVal >= 1000) {
        return `${value < 0 ? '-' : ''}${symbol}${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
    } else {
      // Standard compact format: Billions (B), Millions (M), Thousands (K)
      if (absVal >= 1000000000) {
        return `${value < 0 ? '-' : ''}${isCurrency ? symbol : ''}${(absVal / 1000000000).toFixed(2).replace(/\.00$/, '')}B`;
      }
      if (absVal >= 1000000) {
        return `${value < 0 ? '-' : ''}${isCurrency ? symbol : ''}${(absVal / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
      }
      if (absVal >= 1000) {
        return `${value < 0 ? '-' : ''}${isCurrency ? symbol : ''}${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
    }
  }

  // Regular currency or number format with local string
  if (isCurrency) {
    if (isINR) {
      return `${value < 0 ? '-' : ''}${symbol}${Math.abs(value).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
    return `${value < 0 ? '-' : ''}${symbol}${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  // Standard numeric format
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Clean text labels to prevent clipping in charts and dropdowns
export function truncateLabel(label: string, maxLength: number = 15): string {
  if (!label) return '';
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}...`;
}

export function getSampleCSV(): string {
  const headers = ['Date', 'Region', 'Category', 'Product', 'Sales', 'Profit', 'Quantity', 'Customer Segment'];
  
  const regions = ['North', 'East', 'South', 'West'];
  const categories = {
    Technology: ['Laptops', 'Smartphones', 'Monitors', 'Printers'],
    Furniture: ['Desks', 'Chairs', 'Bookcases', 'Sofas'],
    'Office Supplies': ['Paper', 'Pens', 'Binders', 'Envelopes'],
  };
  const segments = ['Consumer', 'Corporate', 'Home Office'];

  const rows: string[] = [];
  rows.push(headers.join(','));

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2026-06-30');
  const dateRangeMs = endDate.getTime() - startDate.getTime();

  // Generate 250 records to have a rich dashboard experience
  const rowCount = 250;
  
  for (let i = 0; i < rowCount; i++) {
    // Generate dates spread across the 18 months
    const randomMs = Math.random() * dateRangeMs;
    const dateObj = new Date(startDate.getTime() + randomMs);
    const dateStr = dateObj.toISOString().split('T')[0];

    const region = regions[Math.floor(Math.random() * regions.length)];
    
    const catKeys = Object.keys(categories) as (keyof typeof categories)[];
    const category = catKeys[Math.floor(Math.random() * catKeys.length)];
    
    const products = categories[category];
    const product = products[Math.floor(Math.random() * products.length)];

    const segment = segments[Math.floor(Math.random() * segments.length)];

    // Generate correlated values: quantity, sales, profit
    const quantity = Math.floor(Math.random() * 12) + 1; // 1 to 12
    
    let basePrice = 50;
    if (category === 'Technology') basePrice = 450;
    else if (category === 'Furniture') basePrice = 180;
    else basePrice = 15;

    // Add some randomness to pricing
    const price = parseFloat((basePrice * (0.8 + Math.random() * 0.4)).toFixed(2));
    const sales = parseFloat((price * quantity).toFixed(2));
    
    // Profit margin varies by category (e.g. tech is high, furniture low)
    let margin = 0.15; // Office Supplies
    if (category === 'Technology') margin = 0.28;
    else if (category === 'Furniture') margin = 0.08;

    // Introduce random sales/profit variations (including occasional negative profit)
    const marginFluctuation = (Math.random() * 0.3) - 0.1; // -10% to +20%
    const actualMargin = margin + marginFluctuation;
    const profit = parseFloat((sales * actualMargin).toFixed(2));

    // Compile CSV row
    const row = [
      dateStr,
      region,
      category,
      product,
      `$${sales.toFixed(2)}`,  // Test currency parsing
      `$${profit.toFixed(2)}`,
      quantity,
      segment
    ];

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

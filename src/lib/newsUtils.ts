import crypto from 'crypto';

// List of tariff-related keywords
export const TARIFF_KEYWORDS = [
  'tariff', 
  'trade war', 
  'Trump tariff', 
  'China tariff', 
  'import tax', 
  'export tax', 
  'duty',
  'customs duty',
  'trade policy',
  'protectionism',
  'trade deficit',
  'retaliatory tariff',
  'section 301'
];

// List of RSS feed URLs
export const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=tariff+policy+Trump+2025',
  'https://news.google.com/rss/search?q=China+US+tariff',
  'https://news.google.com/rss/search?q=trade+war',
  'https://news.google.com/rss/search?q=import+tax+US+2025',
  'https://news.google.com/rss/headlines/section/topic/BUSINESS'
];

// Generate unique ID based on URL or content
export function createHash(input: string): string {
  return crypto
    .createHash('md5')
    .update(input)
    .digest('hex');
}

// Check if content is tariff-related
export function isTariffRelated(title: string, content?: string): boolean {
  const textToCheck = `${title} ${content || ''}`.toLowerCase();
  
  return TARIFF_KEYWORDS.some(keyword => 
    textToCheck.includes(keyword.toLowerCase())
  );
}

// Extract title and source from Google News RSS item
export function extractTitleAndSource(fullTitle: string): { title: string, source: string } {
  const parts = fullTitle.split(' - ');
  
  if (parts.length > 1) {
    const source = parts.pop() || 'Unknown Source';
    const title = parts.join(' - ');
    return { title, source };
  }
  
  return { title: fullTitle, source: 'Unknown Source' };
}

// Generate all dates within a range (in YYYY-MM-DD format)
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Return empty array if end date is before start date
  if (end < start) {
    return dates;
  }
  
  // Generate all dates
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
} 
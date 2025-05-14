// Interface for a single news item
export interface NewsItem {
  id: string;                // Unique ID (URL or content hash)
  title: string;             // Article title
  content: string;           // Article content or summary
  url: string;               // Original article URL
  source: string;            // News source (e.g., CNN, Bloomberg)
  publishDate: string;       // Original publication date (ISO format)
  dateStr: string;           // Date in YYYY-MM-DD format
  timestamp: number;         // Saved time (Unix timestamp)
  keywords?: string[];       // Related keywords (optional)
}

// News search request parameters
export interface NewsSearchParams {
  query?: string;            // Search query
  source?: string;           // Filter by news source
  startDate?: string;        // Start date (YYYY-MM-DD)
  endDate?: string;          // End date (YYYY-MM-DD)
  page?: number;             // Page number (starts from 1)
  limit?: number;            // Items per page
}

// News search response
export interface NewsSearchResponse {
  items: NewsItem[];         // Array of news items
  total: number;             // Total number of results
  page: number;              // Current page
  totalPages: number;        // Total number of pages
}

// RSS feed item (based on output from rss-parser library)
export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  categories?: string[];
  [key: string]: unknown;    // Other possible fields
} 
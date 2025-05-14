import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { NewsItem } from '@/types/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { source } = req.query;
    
    if (!source || typeof source !== 'string') {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Source parameter is required'
      });
    }
    
    // Convert source key format
    const sourceKey = source.toLowerCase().replace(/\s+/g, '-');
    
    // Get news IDs for the source
    const newsIds = await kv.smembers(`news:source:${sourceKey}`);
    
    // Retrieve news items
    const items: NewsItem[] = [];
    for (const id of newsIds) {
      const item = await kv.get(id) as NewsItem | null;
      if (item) items.push(item);
    }
    
    // Sort by publication date in descending order (newest first)
    items.sort((a, b) => {
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    // Get list of news sources
    const allSources = await getAllSources();
    
    return res.status(200).json({ 
      source,
      count: items.length,
      items,
      availableSources: allSources
    });
  } catch (error) {
    console.error('Error in news-by-source API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get list of all news sources
async function getAllSources(): Promise<string[]> {
  try {
    // Scan all source keys using Redis key pattern
    const keys = await kv.keys('news:source:*');
    
    // Extract source names (remove news:source: prefix)
    return keys.map(key => key.replace('news:source:', ''))
      // Format source names (capitalize first letter of each word)
      .map(source => source.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      );
  } catch (error) {
    console.error('Error getting all sources:', error);
    return [];
  }
} 
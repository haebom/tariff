import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { NewsItem } from '@/types/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Protected by API key (only accessible by cron jobs or administrators)
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.CRON_API_KEY;
  
  // If API key validation is enabled but the key doesn't match
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { days = 60 } = req.query; // Default: delete news older than 60 days
    const daysToKeep = Number(days);
    
    if (isNaN(daysToKeep) || daysToKeep < 7) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Days parameter must be a number greater than or equal to 7'
      });
    }
    
    // Calculate date X days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();
    
    // Get all news items
    const newsIds = await kv.zrange('news:all', 0, -1) as string[];
    let removedCount = 0;
    
    for (const id of newsIds) {
      const item = await kv.get(id) as NewsItem | null;
      
      if (!item) continue;
      
      // Check for old items based on publication date
      const pubDate = new Date(item.publishDate).getTime();
      
      if (pubDate < cutoffTimestamp) {
        // Delete news item
        await kv.del(id);
        
        // Remove from date index
        await kv.srem(`news:date:${item.dateStr}`, id);
        
        // Remove from source index
        const sourceKey = item.source.toLowerCase().replace(/\s+/g, '-');
        await kv.srem(`news:source:${sourceKey}`, id);
        
        // Remove from all news index
        await kv.zrem('news:all', id);
        
        removedCount++;
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      removedCount,
      cutoffDate: cutoffDate.toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cleanup-news API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
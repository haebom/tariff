import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { NewsItem, NewsSearchParams, NewsSearchResponse } from '@/types/news';
import { getDatesInRange } from '@/lib/newsUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      query = '', 
      source = '', 
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.query as unknown as NewsSearchParams;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    let newsIds: string[] = [];
    
    // Filter by source
    if (source) {
      const sourceKey = source.toLowerCase().replace(/\s+/g, '-');
      newsIds = await kv.smembers(`news:source:${sourceKey}`);
    } 
    // Filter by date range
    else if (startDate && endDate) {
      const dates = getDatesInRange(startDate, endDate);
      for (const date of dates) {
        const dateIds = await kv.smembers(`news:date:${date}`);
        newsIds.push(...dateIds);
      }
    } 
    // Default: Retrieve all news (in reverse chronological order)
    else {
      newsIds = await kv.zrange('news:all', 0, -1, { rev: true });
    }
    
    // Filter by search query
    if (query) {
      const items: NewsItem[] = [];
      for (const id of newsIds) {
        const item = await kv.get(id) as NewsItem | null;
        if (item && (
          item.title.toLowerCase().includes(query.toLowerCase()) || 
          item.content.toLowerCase().includes(query.toLowerCase())
        )) {
          items.push(item);
        }
      }
      
      // Extract ID list from search results
      newsIds = items.map(item => item.id);
    }
    
    // Pagination
    const total = newsIds.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const end = Math.min(start + limitNum - 1, total - 1);
    const paginatedIds = end >= 0 ? newsIds.slice(start, end + 1) : [];
    
    // Retrieve data
    const items: NewsItem[] = [];
    for (const id of paginatedIds) {
      const item = await kv.get(id) as NewsItem | null;
      if (item) items.push(item);
    }
    
    const response: NewsSearchResponse = {
      items,
      total,
      page: pageNum,
      totalPages
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in news API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
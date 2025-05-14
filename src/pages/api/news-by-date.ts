import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { NewsItem } from '@/types/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }
    
    // 날짜 형식 검증 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    // 해당 날짜의 뉴스 ID 조회
    const newsIds = await kv.smembers(`news:date:${date}`);
    
    // 뉴스 항목 조회
    const items: NewsItem[] = [];
    for (const id of newsIds) {
      const item = await kv.get(id) as NewsItem | null;
      if (item) items.push(item);
    }
    
    // 발행일 기준 내림차순 정렬 (최신순)
    items.sort((a, b) => {
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    return res.status(200).json({ 
      date,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Error in news-by-date API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
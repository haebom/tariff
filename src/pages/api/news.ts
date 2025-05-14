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
    
    // 소스별 필터링
    if (source) {
      const sourceKey = source.toLowerCase().replace(/\s+/g, '-');
      newsIds = await kv.smembers(`news:source:${sourceKey}`);
    } 
    // 날짜 범위 필터링
    else if (startDate && endDate) {
      const dates = getDatesInRange(startDate, endDate);
      for (const date of dates) {
        const dateIds = await kv.smembers(`news:date:${date}`);
        newsIds.push(...dateIds);
      }
    } 
    // 기본: 전체 뉴스 조회 (최신순)
    else {
      newsIds = await kv.zrange('news:all', 0, -1, { rev: true });
    }
    
    // 검색어 필터링
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
      
      // 검색 결과에서 ID 목록 추출
      newsIds = items.map(item => item.id);
    }
    
    // 페이지네이션
    const total = newsIds.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const end = Math.min(start + limitNum - 1, total - 1);
    const paginatedIds = end >= 0 ? newsIds.slice(start, end + 1) : [];
    
    // 데이터 조회
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
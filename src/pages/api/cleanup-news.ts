import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { NewsItem } from '@/types/news';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // API 키로 보호 (크론 작업이나 관리자만 접근 가능)
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.CRON_API_KEY;
  
  // API 키 검증이 활성화되어 있지만 키가 일치하지 않는 경우
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { days = 60 } = req.query; // 기본적으로 60일 이상 지난 뉴스 삭제
    const daysToKeep = Number(days);
    
    if (isNaN(daysToKeep) || daysToKeep < 7) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Days parameter must be a number greater than or equal to 7'
      });
    }
    
    // X일 전 날짜 계산
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();
    
    // 모든 뉴스 항목 가져오기
    const newsIds = await kv.zrange('news:all', 0, -1) as string[];
    let removedCount = 0;
    
    for (const id of newsIds) {
      const item = await kv.get(id) as NewsItem | null;
      
      if (!item) continue;
      
      // 게시일 기준으로 오래된 항목 확인
      const pubDate = new Date(item.publishDate).getTime();
      
      if (pubDate < cutoffTimestamp) {
        // 뉴스 항목 삭제
        await kv.del(id);
        
        // 날짜별 인덱스에서 삭제
        await kv.srem(`news:date:${item.dateStr}`, id);
        
        // 출처별 인덱스에서 삭제
        const sourceKey = item.source.toLowerCase().replace(/\s+/g, '-');
        await kv.srem(`news:source:${sourceKey}`, id);
        
        // 전체 뉴스 인덱스에서 삭제
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
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
    
    // 소스 키 형식 변환
    const sourceKey = source.toLowerCase().replace(/\s+/g, '-');
    
    // 해당 소스의 뉴스 ID 조회
    const newsIds = await kv.smembers(`news:source:${sourceKey}`);
    
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
    
    // 뉴스 소스 목록 조회
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

// 모든 뉴스 소스 목록 조회
async function getAllSources(): Promise<string[]> {
  try {
    // Redis 키 패턴으로 모든 소스 키 스캔
    const keys = await kv.keys('news:source:*');
    
    // 소스 이름 추출 (news:source: 접두사 제거)
    return keys.map(key => key.replace('news:source:', ''))
      // 소스 이름 포맷 (첫 글자 대문자로)
      .map(source => source.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      );
  } catch (error) {
    console.error('Error getting all sources:', error);
    return [];
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import Parser from 'rss-parser';
import { RSS_FEEDS, createHash, isTariffRelated, extractTitleAndSource } from '@/lib/newsUtils';
import { NewsItem, RSSItem } from '@/types/news';

// 특정 Feed URL에서 뉴스 기사 가져오기
async function fetchNewsFromFeed(feedUrl: string, parser: Parser): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const newsItems: NewsItem[] = [];
    
    for (const item of feed.items as RSSItem[]) {
      if (!item.title || !item.link || !item.pubDate) continue;
      
      // 비즈니스 일반 피드에서는 관세 관련 기사만 필터링
      if (feedUrl.includes('/topic/BUSINESS')) {
        if (!isTariffRelated(item.title, item.contentSnippet)) {
          continue;
        }
      }
      
      // 제목과 출처 추출
      const { title, source } = extractTitleAndSource(item.title);
      
      // 발행일 처리
      const pubDate = new Date(item.pubDate);
      const dateStr = pubDate.toISOString().split('T')[0];
      
      // 고유 ID 생성
      const id = `news:${createHash(item.link)}`;
      
      // 뉴스 항목 생성
      const newsItem: NewsItem = {
        id,
        title,
        content: item.contentSnippet || '',
        url: item.link,
        source,
        publishDate: item.pubDate,
        dateStr,
        timestamp: Date.now()
      };
      
      newsItems.push(newsItem);
    }
    
    return newsItems;
  } catch (error) {
    console.error(`Error fetching from ${feedUrl}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // API 키로 보호 (선택 사항)
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.CRON_API_KEY;
  
  // API 키 검증이 활성화되어 있지만 키가 일치하지 않는 경우
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 크론 작업이 아닌 경우 (선택 사항)
  if (req.headers['x-vercel-cron'] !== 'true' && process.env.NODE_ENV === 'production') {
    // 개발 환경에서는 이 제한을 건너뛰지만, 프로덕션에서는 크론 작업으로만 호출 가능
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'This endpoint can only be called by a cron job' });
    }
  }
  
  try {
    const parser = new Parser();
    let totalNewItems = 0;
    let totalProcessedItems = 0;
    
    // 모든 RSS 피드에서 뉴스 가져오기
    for (const feedUrl of RSS_FEEDS) {
      const newsItems = await fetchNewsFromFeed(feedUrl, parser);
      totalProcessedItems += newsItems.length;
      
      // 각 뉴스 항목 저장
      for (const item of newsItems) {
        // 이미 존재하는지 확인
        const exists = await kv.exists(item.id);
        if (exists) continue;
        
        // 뉴스 항목 저장
        await kv.set(item.id, item);
        
        // 날짜별 인덱스 업데이트
        await kv.sadd(`news:date:${item.dateStr}`, item.id);
        
        // 출처별 인덱스 업데이트
        const sourceKey = item.source.toLowerCase().replace(/\s+/g, '-');
        await kv.sadd(`news:source:${sourceKey}`, item.id);
        
        // 전체 뉴스 인덱스에 추가 (점수 = 타임스탬프, 최신순 정렬용)
        await kv.zadd('news:all', { 
          score: new Date(item.publishDate).getTime(), 
          member: item.id 
        });
        
        totalNewItems++;
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      processedItems: totalProcessedItems,
      newItems: totalNewItems,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in fetch-news API route:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
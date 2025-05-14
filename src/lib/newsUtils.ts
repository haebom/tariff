import crypto from 'crypto';

// 관세 관련 키워드 목록
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

// RSS 피드 URL 리스트
export const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=tariff+policy+Trump+2025',
  'https://news.google.com/rss/search?q=China+US+tariff',
  'https://news.google.com/rss/search?q=trade+war',
  'https://news.google.com/rss/search?q=import+tax+US+2025',
  'https://news.google.com/rss/headlines/section/topic/BUSINESS'
];

// URL이나 콘텐츠를 기반으로 고유 ID 생성
export function createHash(input: string): string {
  return crypto
    .createHash('md5')
    .update(input)
    .digest('hex');
}

// 콘텐츠가 관세 관련인지 확인
export function isTariffRelated(title: string, content?: string): boolean {
  const textToCheck = `${title} ${content || ''}`.toLowerCase();
  
  return TARIFF_KEYWORDS.some(keyword => 
    textToCheck.includes(keyword.toLowerCase())
  );
}

// Google News RSS 항목에서 제목과 출처 추출
export function extractTitleAndSource(fullTitle: string): { title: string, source: string } {
  const parts = fullTitle.split(' - ');
  
  if (parts.length > 1) {
    const source = parts.pop() || 'Unknown Source';
    const title = parts.join(' - ');
    return { title, source };
  }
  
  return { title: fullTitle, source: 'Unknown Source' };
}

// 날짜 범위 내의 모든 날짜 생성 (YYYY-MM-DD 형식)
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 종료일이 시작일보다 이전이면 빈 배열 반환
  if (end < start) {
    return dates;
  }
  
  // 모든 날짜 생성
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
} 
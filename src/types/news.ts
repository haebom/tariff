// 단일 뉴스 항목을 위한 인터페이스
export interface NewsItem {
  id: string;                // 고유 ID (URL 또는 내용 해시)
  title: string;             // 기사 제목
  content: string;           // 기사 내용 또는 요약
  url: string;               // 원본 기사 URL
  source: string;            // 뉴스 출처 (예: CNN, Bloomberg)
  publishDate: string;       // 원본 게시일 (ISO 형식)
  dateStr: string;           // YYYY-MM-DD 형식의 날짜
  timestamp: number;         // 저장 시간 (Unix 타임스탬프)
  keywords?: string[];       // 관련 키워드 (옵션)
}

// 뉴스 검색 요청 매개변수
export interface NewsSearchParams {
  query?: string;            // 검색어
  source?: string;           // 뉴스 출처로 필터링
  startDate?: string;        // 시작 날짜 (YYYY-MM-DD)
  endDate?: string;          // 종료 날짜 (YYYY-MM-DD)
  page?: number;             // 페이지 번호 (1부터 시작)
  limit?: number;            // 페이지당 항목 수
}

// 뉴스 검색 응답
export interface NewsSearchResponse {
  items: NewsItem[];         // 뉴스 항목 배열
  total: number;             // 총 결과 수
  page: number;              // 현재 페이지
  totalPages: number;        // 총 페이지 수
}

// RSS 피드 항목 (rss-parser 라이브러리의 출력에 기반)
export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  categories?: string[];
  [key: string]: any;        // 기타 가능한 필드
} 
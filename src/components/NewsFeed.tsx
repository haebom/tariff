'use client';

import React, { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { useSharedState } from '@/context/AppContext'; // 공유 컨텍스트 import

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  source?: string;
}

// Type definitions for parsed XML items
interface RssItem {
  title?: string | { '#text': string };
  link?: string | { '@_href'?: string }; // Can also be an object if attributes are present
  pubDate?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow other fields, as RSS items can be diverse
}

interface AtomEntryLink {
  '@_href'?: string;
  '@_rel'?: string;
  '@_type'?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface AtomEntry {
  title?: string | { '#text': string };
  link?: AtomEntryLink | AtomEntryLink[];
  updated?: string;
  published?: string;
  summary?: string | { '#text': string };
  content?: string | { '#text': string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// 파싱된 아이템의 최소 구조 정의 (선택적)
// interface ParsedFeedItem { 
//   title?: any;
//   link?: any;
//   pubDate?: string;
//   description?: any;
//   summary?: any;
//   content?: any;
//   updated?: string;
//   published?: string;
//   ['@_href']?: string; // Atom link attribute
// }

export default function NewsFeed() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [rawFilterTerm, setRawFilterTerm] = useState('');

  const { selectedTariffKeyword } = useSharedState(); // 공유 상태 가져오기

  // 다이어그램에서 선택된 키워드가 변경되면 filterKeywords 와 rawFilterTerm 업데이트
  useEffect(() => {
    if (selectedTariffKeyword) {
      setRawFilterTerm(selectedTariffKeyword); // 검색창에는 원본 또는 가공된 키워드 표시
      // 키워드 분리 로직 (개선 가능)
      const keywords = selectedTariffKeyword
        .toLowerCase()
        // 공백, 쉼표, 세미콜론, 마침표, % 등을 기준으로 분리하고, 길이가 1보다 큰 유효한 단어만 필터링
        .split(/[\\s,;%\\.\\-\\(\\)]+/) 
        .filter(kw => kw && kw.length > 1 && !/^\\d+$/.test(kw) && kw !== 'tariff' && kw !== 'and' && kw !== 'the' && kw !== 'for' && kw !== 'is' && kw !== 'of');
      
      // 분리된 키워드가 있으면 사용, 없으면 원본 키워드를 소문자로 변환하여 배열에 넣음 (null 체크 추가)
      setFilterKeywords(keywords.length > 0 ? keywords : (selectedTariffKeyword ? [selectedTariffKeyword.toLowerCase()] : []));
    } else {
      // selectedTariffKeyword가 null일 때 (예: 다이어그램 선택 해제)
      // 사용자가 검색창에 직접 입력한 내용이 없다면 모든 필터 키워드 초기화
      // rawFilterTerm은 사용자가 검색창에 남겨둔 값일 수 있으므로 여기서는 초기화하지 않음.
      // 필요하다면 setRawFilterTerm(''); 추가 가능
      if (rawFilterTerm.trim() === '') {
         setFilterKeywords([]);
      }
    }
  }, [selectedTariffKeyword]); // rawFilterTerm 의존성 제거 또는 신중히 추가 고려

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);
      setError(null);
      console.log('[NewsFeed] Starting to fetch news...');
      try {
        const response = await fetch('/api/rss');
        console.log('[NewsFeed] Response from /api/rss:', response);

        if (!response.ok) {
          console.error('[NewsFeed] Failed to fetch from /api/rss. Status:', response.status);
          throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
        }
        const xmlText = await response.text();
        console.log('[NewsFeed] Received XML Text from /api/rss (first 500 chars):', xmlText.substring(0, 500));
        
        const parser = new XMLParser({
          ignoreAttributes: false, 
          attributeNamePrefix: "@_", 
        });
        const result = parser.parse(xmlText);
        console.log('[NewsFeed] Parsed XML Result:', result);

        let items: NewsItem[] = [];
        if (result.rss && result.rss.channel && result.rss.channel.item) {
          console.log('[NewsFeed] Parsing as RSS feed.');
          items = (Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item])
            .map((item: RssItem) => { 
              let itemLink = '#';
              if (typeof item.link === 'string') {
                itemLink = item.link;
              } else if (item.link && typeof item.link === 'object' && item.link['@_href']) {
                itemLink = item.link['@_href'];
              } else if (item.link && typeof item.link === 'object') { 
                itemLink = String(item.link);
              }

              let itemTitle = 'No title';
              if (typeof item.title === 'string') {
                itemTitle = item.title;
              } else if (item.title && typeof item.title === 'object' && item.title['#text']) {
                itemTitle = item.title['#text'];
              }

              return {
                title: itemTitle,
                link: itemLink,
                pubDate: item.pubDate,
                description: item.description,
                source: result.rss.channel.title || 'Unknown Source'
              };
            });
        } else if (result.feed && result.feed.entry) {
          console.log('[NewsFeed] Parsing as Atom feed.');
           items = (Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry])
            .map((entry: AtomEntry) => { 
              let atomLink = '#';
              if (entry.link) {
                if (Array.isArray(entry.link)) {
                  const hrefLink = entry.link.find((l: AtomEntryLink) => l['@_rel'] === 'alternate' || !l['@_rel']);
                  atomLink = hrefLink ? (hrefLink['@_href'] || '#') : (entry.link[0] && entry.link[0]['@_href'] ? entry.link[0]['@_href'] : '#');
                } else if (entry.link['@_href']) {
                  atomLink = entry.link['@_href'];
                }
              }

              let entryTitle = 'No title';
              if (typeof entry.title === 'string') {
                entryTitle = entry.title;
              } else if (entry.title && typeof entry.title === 'object' && entry.title['#text']) {
                entryTitle = entry.title['#text'];
              }

              let entryDescription = undefined;
              if (typeof entry.summary === 'string') {
                entryDescription = entry.summary;
              } else if (entry.summary && typeof entry.summary === 'object' && entry.summary['#text']) {
                entryDescription = entry.summary['#text'];
              } else if (typeof entry.content === 'string') {
                entryDescription = entry.content;
              } else if (entry.content && typeof entry.content === 'object' && entry.content['#text']) {
                entryDescription = entry.content['#text'];
              }

              return {
                title: entryTitle,
                link: atomLink,
                pubDate: entry.updated || entry.published,
                description: entryDescription,
                source: result.feed.title || 'Unknown Source'
              };
            });
        } else {
          console.warn('[NewsFeed] Could not find RSS items or Atom entries in parsed data.');
        }
        setNewsItems(items);
        console.log('[NewsFeed] Final news items set in state:', items);
      } catch (err) {
        console.error("[NewsFeed] Error fetching or parsing RSS feed:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching news.');
      }
      setIsLoading(false);
      console.log('[NewsFeed] Finished fetching news. Loading set to false.');
    }

    fetchNews();
  }, []);

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setRawFilterTerm(term); // 사용자가 입력한 값으로 rawFilterTerm 업데이트

    if (term.trim() === '') {
      // 입력이 비었을 때, 다이어그램 선택 키워드도 없다면 필터 키워드 비움
      if (!selectedTariffKeyword) {
        setFilterKeywords([]);
      } else {
        // 다이어그램 키워드가 있다면 그것으로 다시 필터링 (위 useEffect 로직과 유사하게)
        const keywords = selectedTariffKeyword
          .toLowerCase()
          .split(/[\\s,;%\\.\\-\\(\\)]+/)
          .filter(kw => kw && kw.length > 1 && !/^\\d+$/.test(kw) && kw !== 'tariff' && kw !== 'and' && kw !== 'the' && kw !== 'for' && kw !== 'is' && kw !== 'of');
        setFilterKeywords(keywords.length > 0 ? keywords : (selectedTariffKeyword ? [selectedTariffKeyword.toLowerCase()] : []));
      }
    } else {
      // 사용자가 직접 입력한 경우, 입력된 term을 소문자로 분리하여 키워드로 사용
       const keywords = term
        .toLowerCase()
        .split(/[\\s,;%\\.\\-\\(\\)]+/)
        .filter(kw => kw && kw.length > 0); // 직접 입력 시에는 좀 더 관대한 필터링
      setFilterKeywords(keywords.length > 0 ? keywords : []);
    }
  };

  const filteredNewsItems = newsItems.filter(item => {
    // 필터 키워드가 없으면 (그리고 rawFilterTerm도 비어있다면) 모든 아이템을 보여주는 것이 자연스러움
    if (filterKeywords.length === 0) {
      return true; 
    }

    // filterKeywords 배열의 키워드 중 하나라도 제목이나 설명에 포함되면 true (OR 조건)
    return filterKeywords.some(keyword => {
      if (!keyword) return false; // 빈 키워드 방지
      const lowerKeyword = keyword.toLowerCase();
      return item.title.toLowerCase().includes(lowerKeyword) ||
             (item.description && item.description.toLowerCase().includes(lowerKeyword));
    });
  });

  // Tailwind CSS classes for styling
  const asideContainerClasses = "h-full flex flex-col bg-sidebar-bg text-foreground";
  const inputClasses = "w-full p-2 my-4 mx-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 flex-shrink-0 max-w-[calc(100%-1rem)]";
  const listClasses = "list-none p-0 m-0 flex-grow overflow-y-auto px-2";
  const listItemClasses = "mb-4 border-b border-gray-200 dark:border-gray-700 pb-2";
  const linkClasses = "text-blue-600 dark:text-blue-400 hover:underline";
  const titleClasses = "text-base font-medium mb-1";
  const smallTextClasses = "text-xs text-gray-500 dark:text-gray-400 block mb-1";
  const descriptionClasses = "text-sm text-gray-700 dark:text-gray-300 m-0";
  const messageClasses = "p-4 text-center text-gray-500 dark:text-gray-400";

  if (isLoading) {
    return <div className={`${asideContainerClasses} items-center justify-center`}><p className={messageClasses}>Loading news...</p></div>;
  }

  if (error) {
    return <div className={`${asideContainerClasses} items-center justify-center`}><p className={messageClasses}>Error loading news: {error}</p></div>;
  }

  return (
    <div className={asideContainerClasses}>
      <input 
        type="text"
        placeholder="Filter news by keywords..."
        value={rawFilterTerm} 
        onChange={handleTextInputChange}
        className={inputClasses}
      />
      {/* 결과 없음 메시지 조건 수정 */}
      {filteredNewsItems.length === 0 && !isLoading && (filterKeywords.length > 0 || rawFilterTerm.trim() !== '') && 
        <p className={messageClasses}>
          No news items found matching your filter
          {rawFilterTerm.trim() !== '' && ` for "${rawFilterTerm}"`}
          .
        </p>
      }
      {/* 초기 로드 시 뉴스 자체가 없을 경우 (네트워크 오류 등이 아닌 빈 피드) */}
      {newsItems.length === 0 && !isLoading && !error && filterKeywords.length === 0 && rawFilterTerm.trim() === '' &&
        <p className={messageClasses}>News feed is currently empty or no initial filter applied.</p>
      }
      <ul className={listClasses}>
        {filteredNewsItems.map((item, index) => (
          <li key={`${item.link}-${item.title}-${index}`} className={listItemClasses}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className={linkClasses}>
              <h3 className={titleClasses}>{item.title}</h3>
            </a>
            {item.pubDate && <small className={smallTextClasses}>{new Date(item.pubDate).toLocaleDateString()}</small>}
            {item.description && <p className={descriptionClasses} dangerouslySetInnerHTML={{ __html: item.description }}></p>}
            {item.source && <small className={`${smallTextClasses} mt-1`}>Source: {item.source}</small>}\
          </li>
        ))}\
      </ul>
    </div>
  );
} 
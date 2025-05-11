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
  const [filterTerm, setFilterTerm] = useState('');

  const { selectedTariffKeyword } = useSharedState(); // 공유 상태 가져오기

  // 다이어그램에서 선택된 키워드가 변경되면 filterTerm 업데이트
  useEffect(() => {
    if (selectedTariffKeyword) {
      setFilterTerm(selectedTariffKeyword);
    }
    // 선택적: 키워드가 null이 되면 필터 초기화
    // else {
    //   setFilterTerm('');
    // }
  }, [selectedTariffKeyword]);

  useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/rss');
        if (!response.ok) {
          throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
        }
        const xmlText = await response.text();
        
        const parser = new XMLParser({
          ignoreAttributes: false, 
          attributeNamePrefix: "@_", 
        });
        const result = parser.parse(xmlText);

        let items: NewsItem[] = [];
        if (result.rss && result.rss.channel && result.rss.channel.item) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items = (Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => { 
              return {
                title: item.title || 'No title',
                link: item.link || '#',
                pubDate: item.pubDate,
                description: item.description,
                source: result.rss.channel.title || 'Unknown Source'
              };
            });
        } else if (result.feed && result.feed.entry) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
           items = (Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((entry: any) => { 
              let atomLink = '#';
              if (entry.link) {
                if (Array.isArray(entry.link)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const hrefLink = entry.link.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel']);
                  atomLink = hrefLink ? hrefLink['@_href'] : (entry.link[0] ? entry.link[0]['@_href'] : '#');
                } else if (entry.link['@_href']) {
                  atomLink = entry.link['@_href'];
                }
              }
              return {
                title: entry.title || (entry.title && typeof entry.title === 'object' ? entry.title['#text'] : 'No title'),
                link: atomLink,
                pubDate: entry.updated || entry.published,
                description: entry.summary || (entry.content && typeof entry.content === 'object' ? entry.content['#text'] : entry.content),
                source: result.feed.title || 'Unknown Source'
              };
            });
        }
        setNewsItems(items);
      } catch (err) {
        console.error("Error fetching or parsing RSS feed:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching news.');
      }
      setIsLoading(false);
    }

    fetchNews();
  }, []);

  const filteredNewsItems = newsItems.filter(item => 
    item.title.toLowerCase().includes(filterTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(filterTerm.toLowerCase()))
  );

  // Tailwind CSS classes for styling
  const asideContainerClasses = "h-full flex flex-col bg-sidebar-bg text-foreground"; // Removed p-4, it's handled by parent in page.tsx
  const inputClasses = "w-full p-2 my-4 mx-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 flex-shrink-0 max-w-[calc(100%-1rem)]"; // Added flex-shrink-0 and margin, max-width to prevent overflow due to parent padding
  const listClasses = "list-none p-0 m-0 flex-grow overflow-y-auto px-2"; // Added flex-grow, overflow-y-auto, and horizontal padding
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
    // Use div instead of aside, as page.tsx already provides the semantic aside tag with sidebar class.
    // This component will fill the div provided by page.tsx for the news feed area.
    <div className={asideContainerClasses}>
      {/* <h2 className={headingClasses}>Latest News (Tariffs)</h2> page.tsx already has a title for this section */}
      <input 
        type="text"
        placeholder="Filter news..."
        value={filterTerm} 
        onChange={(e) => setFilterTerm(e.target.value)}
        className={inputClasses}
      />
      {filteredNewsItems.length === 0 && !isLoading && <p className={messageClasses}>No news items found matching your filter or feed is empty.</p>}
      <ul className={listClasses}>
        {filteredNewsItems.map((item, index) => (
          <li key={`${item.link}-${item.title}-${index}`} className={listItemClasses}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className={linkClasses}>
              <h3 className={titleClasses}>{item.title}</h3>
            </a>
            {item.pubDate && <small className={smallTextClasses}>{new Date(item.pubDate).toLocaleDateString()}</small>}
            {item.description && <p className={descriptionClasses} dangerouslySetInnerHTML={{ __html: item.description }}></p>}
            {item.source && <small className={`${smallTextClasses} mt-1`}>Source: {item.source}</small>}
          </li>
        ))}
      </ul>
    </div>
  );
} 
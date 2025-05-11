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

  if (isLoading) {
    return <aside className="sidebar" id="sidebar-right"><p>Loading news...</p></aside>;
  }

  if (error) {
    return <aside className="sidebar" id="sidebar-right"><p>Error loading news: {error}</p></aside>;
  }

  return (
    <aside className="sidebar" id="sidebar-right" style={{ padding: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Latest News (Tariffs)</h2>
      <input 
        type="text"
        placeholder="Filter news..."
        value={filterTerm} // filterTerm이 selectedTariffKeyword에 의해 업데이트됨
        onChange={(e) => setFilterTerm(e.target.value)} // 사용자가 직접 필터링도 가능
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      {filteredNewsItems.length === 0 && <p>No news items found matching your filter or feed is empty.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filteredNewsItems.map((item, index) => (
          <li key={`${item.link}-${item.title}-${index}`} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ fontSize: '1.1em', marginBottom: '0.25rem', color: '#007acc' }}>{item.title}</h3>
            </a>
            {item.pubDate && <small style={{ color: '#555', display: 'block', marginBottom: '0.25rem' }}>{new Date(item.pubDate).toLocaleDateString()}</small>}
            {item.description && <p style={{ fontSize: '0.9em', margin: 0, color: '#333' }} dangerouslySetInnerHTML={{ __html: item.description }}></p>}
            {item.source && <small style={{color: '#777', display: 'block', marginTop: '0.25rem'}}>Source: {item.source}</small>}
          </li>
        ))}
      </ul>
    </aside>
  );
} 
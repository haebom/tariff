'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { useSharedState } from '@/context/AppContext'; // Import shared context
import Image from 'next/image';

interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  source?: string;
  imageUrl?: string; // Thumbnail image URL
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
  const [filteredNewsItems, setFilteredNewsItems] = useState<NewsItem[]>([]);

  const { selectedTariffKeyword } = useSharedState(); // Get shared state

  // Update filterKeywords and rawFilterTerm when selected keyword changes in diagram
  useEffect(() => {
    if (selectedTariffKeyword) {
      setRawFilterTerm(selectedTariffKeyword); // Show original or processed keyword in search box
      // Keyword separation logic (can be improved)
      const keywords = selectedTariffKeyword
        .toLowerCase()
        // Split by spaces, commas, semicolons, periods, %, etc., and filter valid words with length > 1
        .split(/[\s,;%\.\-\(\)]+/) 
        .filter(kw => kw && kw.length > 1 && !/^\d+$/.test(kw) && kw !== 'tariff' && kw !== 'and' && kw !== 'the' && kw !== 'for' && kw !== 'is' && kw !== 'of');
      
      // Use separated keywords if available, otherwise use original keyword in lowercase
      setFilterKeywords(keywords.length > 0 ? keywords : (selectedTariffKeyword ? [selectedTariffKeyword.toLowerCase()] : []));
    } else {
      // When selectedTariffKeyword is null (e.g., diagram selection cleared)
      // If user has not directly entered anything in search box, reset all filter keywords
      if (rawFilterTerm.trim() === '') {
         setFilterKeywords([]);
      }
    }
  }, [selectedTariffKeyword, rawFilterTerm]); // Added rawFilterTerm dependency

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

              // 썸네일 이미지 추출
              let imageUrl;
              if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
                imageUrl = item['media:thumbnail']['@_url'];
              } else if (item['media:content'] && item['media:content']['@_url']) {
                imageUrl = item['media:content']['@_url'];
              } else if (item.enclosure && item.enclosure['@_url']) {
                imageUrl = item.enclosure['@_url'];
              } else if (item.image && typeof item.image === 'string') {
                imageUrl = item.image;
              }

              return {
                title: itemTitle,
                link: itemLink,
                pubDate: item.pubDate,
                description: item.description,
                source: result.rss.channel.title || 'Unknown Source',
                imageUrl: imageUrl,
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

              // Atom 피드 썸네일 추출 (일부 Atom 피드에서 media:thumbnail, media:content, image 등 사용)
              let imageUrl;
              if (entry['media:thumbnail'] && entry['media:thumbnail']['@_url']) {
                imageUrl = entry['media:thumbnail']['@_url'];
              } else if (entry['media:content'] && entry['media:content']['@_url']) {
                imageUrl = entry['media:content']['@_url'];
              } else if (entry.enclosure && entry.enclosure['@_url']) {
                imageUrl = entry.enclosure['@_url'];
              } else if (entry.image && typeof entry.image === 'string') {
                imageUrl = entry.image;
              }

              return {
                title: entryTitle,
                link: atomLink,
                pubDate: entry.updated || entry.published,
                description: entryDescription,
                source: result.feed.title || 'Unknown Source',
                imageUrl: imageUrl,
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
    setRawFilterTerm(term); // Update rawFilterTerm with user input

    if (term.trim() === '') {
      // When input is empty and no diagram keyword, clear filter keywords
      if (!selectedTariffKeyword) {
        setFilterKeywords([]);
      } else {
        // If diagram keyword exists, filter using it (similar to above useEffect logic)
        const keywords = selectedTariffKeyword
          .toLowerCase()
          .split(/[\s,;%\.\-\(\)]+/)
          .filter(kw => kw && kw.length > 1 && !/^\d+$/.test(kw) && kw !== 'tariff' && kw !== 'and' && kw !== 'the' && kw !== 'for' && kw !== 'is' && kw !== 'of');
        setFilterKeywords(keywords.length > 0 ? keywords : (selectedTariffKeyword ? [selectedTariffKeyword.toLowerCase()] : []));
      }
    } else {
      // For user direct input, split term to lowercase and use as keywords
      const keywords = term
        .toLowerCase()
        .split(/[\s,;%\.\-\(\)]+/)
        .filter(kw => kw && kw.length > 0); // More permissive filtering for direct input
      setFilterKeywords(keywords.length > 0 ? keywords : []);
    }
  };

  const filterNewsItems = useCallback(() => {
    if (!rawFilterTerm.trim()) {
      return newsItems;
    }

    // Split search terms by spaces and filter out empty strings
    const searchTerms = rawFilterTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    return newsItems.filter(item => {
      // Check if any of the search terms match (OR operation)
      return searchTerms.some(term => {
        // Split the term into individual keywords if it contains OR
        const keywords = term.split(/\s*or\s*/i);
        
        // Check if any of the keywords match (OR operation)
        return keywords.some(keyword => {
          const titleMatch = item.title.toLowerCase().includes(keyword);
          const descriptionMatch = item.description && item.description.toLowerCase().includes(keyword);
          const dateMatch = item.pubDate && item.pubDate.toLowerCase().includes(keyword);
          const sourceMatch = item.source && item.source.toLowerCase().includes(keyword);
          
          return titleMatch || descriptionMatch || dateMatch || sourceMatch;
        });
      });
    });
  }, [rawFilterTerm, newsItems]);

  // Update filtered news items when filter term changes
  useEffect(() => {
    const filtered = filterNewsItems();
    setFilteredNewsItems(filtered);
  }, [filterNewsItems]);

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
      {/* Modified "No results" message condition */}
      {filteredNewsItems.length === 0 && !isLoading && (filterKeywords.length > 0 || rawFilterTerm.trim() !== '') && 
        <p className={messageClasses}>
          No news items found matching your filter
          {rawFilterTerm.trim() !== '' && ` for "${rawFilterTerm}"`}
          .
        </p>
      }
      {/* For initially empty news feed (not due to network error but empty feed) */}
      {newsItems.length === 0 && !isLoading && !error && filterKeywords.length === 0 && rawFilterTerm.trim() === '' &&
        <p className={messageClasses}>News feed is currently empty or no initial filter applied.</p>
      }
      <ul className={listClasses}>
        {filteredNewsItems.map((item, index) => (
          <li key={`${item.link}-${item.title}-${index}`} className={listItemClasses + ' flex items-start'}>
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded mr-3 flex-shrink-0"
                unoptimized
              />
            )}
            <div className="flex-1">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className={linkClasses}>
                <h3 className={titleClasses}>{item.title}</h3>
              </a>
              {item.pubDate && <small className={smallTextClasses}>{new Date(item.pubDate).toLocaleDateString()}</small>}
              {item.description && <p className={descriptionClasses} dangerouslySetInnerHTML={{ __html: item.description }}></p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 
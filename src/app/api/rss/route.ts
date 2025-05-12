import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('q') || 'tariff';
  
  // Support OR search by replacing spaces with OR operator
  const formattedQuery = searchQuery.includes(' OR ') 
    ? searchQuery  // Already has OR operator
    : searchQuery.replace(/\s+/g, ' OR ');  // Replace spaces with OR
    
  // Use the formatted query for Google News search
  const targetUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(formattedQuery)}`;
  
  console.log(`Fetching RSS from: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, application/atom+xml;q=0.7, */*;q=0.5'
      },
      cache: 'no-store', // Ensure fresh data is fetched every time
    });

    console.log(`RSS Feed Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch RSS feed. Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorText.substring(0, 500)}`);
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }

    const feedText = await response.text();
    console.log(`RSS Feed Text (first 500 chars): ${feedText.substring(0, 500)}`);

    if (!feedText.trim().startsWith('<?xml')) {
        console.error("Fetched content does not appear to be XML:", feedText.substring(0, 500));
        throw new Error('Fetched content is not valid XML.');
    }

    return new NextResponse(feedText, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching of this proxy response
      },
    });
  } catch (error: unknown) {
    console.error("Error in /api/rss route:", error);
    let errorMessage = 'Failed to fetch RSS feed due to an internal error.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? String(error) : 'Unknown error' },
      { status: 500 }
    );
  }
} 
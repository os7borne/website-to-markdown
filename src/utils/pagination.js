/**
 * Detect pagination patterns in URLs
 */
export function detectPagination(urls) {
  const patterns = {
    // Pattern types and their regexes
    pageQuery: /[?&]page[=/](\d+)/i,
    offsetQuery: /[?&](offset|start)[=/](\d+)/i,
    pathPage: /\/page[\/-]?(\d+)/i,
    pathNumber: /\/(\d+)(?:\/|$)/,
  };

  const paginationUrls = [];
  const seenPatterns = new Set();

  for (const urlObj of urls) {
    const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
    
    for (const [type, regex] of Object.entries(patterns)) {
      const match = url.match(regex);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        // Only consider reasonable page numbers (2-1000)
        if (pageNum >= 2 && pageNum <= 1000) {
          paginationUrls.push({ url, page: pageNum, type });
          seenPatterns.add(type);
        }
      }
    }
  }

  return {
    hasPagination: paginationUrls.length > 0,
    pages: paginationUrls.sort((a, b) => a.page - b.page),
    patterns: Array.from(seenPatterns),
  };
}

/**
 * Generate potential pagination URLs based on detected pattern
 */
export function generatePaginationUrls(baseUrl, maxPages = 10) {
  const urls = [];
  
  // Try common pagination patterns
  const patterns = [
    (n) => `${baseUrl}?page=${n}`,
    (n) => `${baseUrl}&page=${n}`,
    (n) => `${baseUrl}/page/${n}`,
    (n) => `${baseUrl}/page-${n}`,
    (n) => `${baseUrl}/p/${n}`,
  ];
  
  for (let i = 2; i <= maxPages; i++) {
    for (const pattern of patterns) {
      urls.push(pattern(i));
    }
  }
  
  return urls;
}

/**
 * Check if URL is likely a pagination link
 */
export function isPaginationLink(text, href) {
  const paginationKeywords = [
    'next', 'previous', 'prev', '»', '›', '→', '>>', '>',
    'page', 'older', 'newer', 'load more', 'show more'
  ];
  
  const lowerText = text.toLowerCase();
  const lowerHref = href.toLowerCase();
  
  return paginationKeywords.some(kw => 
    lowerText.includes(kw) || lowerHref.includes(kw)
  );
}

/**
 * Extract page number from URL
 */
export function extractPageNumber(url) {
  const patterns = [
    /[?&]page[=/](\d+)/i,
    /[?&](?:offset|start)[=/](\d+)/i,
    /\/page[\/-]?(\d+)/i,
    /\/p[\/-]?(\d+)/i,
    /\/(\d+)(?:\/|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return 1;
}

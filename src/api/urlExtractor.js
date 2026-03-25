// Use relative URLs to call our proxy server
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Extract all URLs from a webpage (via proxy)
 * @param {string} url - The URL to crawl
 * @param {Object} options - Extraction options
 * @returns {Promise<Array<{url: string, title: string}>>} - Array of URLs found
 */
export async function extractUrls(url, options = {}) {
  console.log('Extracting URLs from:', url, options);
  
  const params = new URLSearchParams();
  params.append('url', url);
  if (options.paginate) params.append('paginate', 'true');
  if (options.maxPages) params.append('maxPages', options.maxPages.toString());
  
  const response = await fetch(`${API_BASE}/extract?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract URLs');
  }

  const data = await response.json();
  console.log('Extracted URLs:', data.count, 'Methods:', data.methods);
  
  return data.urls;
}

/**
 * Convert a single URL to markdown (via proxy)
 * @param {string} url - The URL to convert
 * @param {Object} options - Conversion options
 * @returns {Promise<{url: string, title: string, markdown: string, tokens?: number}>}
 */
export async function convertUrlToMarkdown(url, options = {}) {
  const params = new URLSearchParams();
  params.append('url', url);
  if (options.method) params.append('method', options.method);
  if (options.retain_images) params.append('retain_images', 'true');
  
  const apiUrl = `${API_BASE}/convert?${params.toString()}`;
  console.log('Converting URL:', url);

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to convert ${url}`);
  }

  const data = await response.json();
  
  return {
    url: data.url,
    title: data.title,
    markdown: data.markdown,
    tokens: data.tokens,
  };
}

/**
 * Convert multiple URLs to markdown with progress callback
 * @param {Array<{url: string, title: string}>} urls - URLs to convert
 * @param {Function} onProgress - Callback for progress updates
 * @param {Object} options - Conversion options
 * @returns {Promise<Array>} - Array of converted pages
 */
export async function convertUrls(urls, onProgress, options = {}) {
  const results = [];
  const total = urls.length;

  for (let i = 0; i < urls.length; i++) {
    const { url, title } = urls[i];
    
    onProgress({
      current: i + 1,
      total,
      url,
      status: 'converting',
    });

    try {
      const result = await convertUrlToMarkdown(url, options);
      results.push(result);
      
      onProgress({
        current: i + 1,
        total,
        url,
        status: 'success',
        result,
      });
    } catch (err) {
      console.error(`Failed to convert ${url}:`, err);
      results.push({
        url,
        title,
        markdown: `# Error\n\nFailed to convert ${url}: ${err.message}`,
        error: err.message,
      });
      
      onProgress({
        current: i + 1,
        total,
        url,
        status: 'error',
        error: err.message,
      });
    }

    // Small delay to avoid rate limiting
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

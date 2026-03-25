import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

const MARKDOWN_API_BASE = 'https://markdown.new';

async function fetchSitemap(baseUrl) {
  const sitemapUrls = [
    new URL('/sitemap.xml', baseUrl).href,
    new URL('/sitemap_index.xml', baseUrl).href,
    new URL('/wp-sitemap.xml', baseUrl).href,
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkdownBot/1.0)' },
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const urls = [];
      const urlRegex = /<loc>([^<]+)<\/loc>/g;
      let match;
      while ((match = urlRegex.exec(xml)) !== null) urls.push(match[1].trim());
      if (urls.length > 0) {
        console.log(`Found ${urls.length} URLs from sitemap`);
        return urls;
      }
    } catch {}
  }
  return null;
}

async function extractFromHtml(url, basePath = null) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarkdownBot/1.0)' },
  });
  if (!response.ok) throw new Error(response.statusText);
  const html = await response.text();
  const baseUrlObj = new URL(url);
  const baseHostname = baseUrlObj.hostname;
  // Extract base path from input URL (e.g., /insights/memos from /insights/memos/page/2)
  const basePathPrefix = basePath || baseUrlObj.pathname.replace(/\/[^\/]*$/, '/');
  const urls = new Map();
  
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  urls.set(url, { url, title: titleMatch ? titleMatch[1].trim() : url });

  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || 
        href.startsWith('mailto:')) continue;
    try {
      const absolute = new URL(href, url).href;
      const absoluteUrl = new URL(absolute);
      // Check hostname matches AND path starts with base path prefix
      if (absoluteUrl.hostname === baseHostname && !urls.has(absolute)) {
        // Only include URLs within the same path section
        if (absoluteUrl.pathname.startsWith(basePathPrefix) || absoluteUrl.pathname === basePathPrefix.slice(0, -1)) {
          urls.set(absolute, { url: absolute, title: text || absolute });
        }
      }
    } catch {}
  }
  return { urls, html };
}

async function fetchPagination(baseUrl, html, maxPages = 3, basePath = '/') {
  const allUrls = new Map();
  const patterns = [
    /<a[^>]*href=["']([^"']*\?page[=\/]\d+[^"']*)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*\/page[\/](?:\d+)[^"']*)["'][^>]*>/gi,
  ];
  
  const links = new Set();
  for (const regex of patterns) {
    let m; while ((m = regex.exec(html)) !== null) {
      try { 
        const linkUrl = new URL(m[1], baseUrl).href;
        const linkUrlObj = new URL(linkUrl);
        // Only include pagination links within the same base path
        if (linkUrlObj.pathname.startsWith(basePath)) {
          links.add(linkUrl);
        }
      } catch {}
    }
  }
  
  const nextRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>\s*(?:next|>|»)\s*<\/a>/gi;
  let nm; while ((nm = nextRegex.exec(html)) !== null) {
    try { 
      const linkUrl = new URL(nm[1], baseUrl).href;
      const linkUrlObj = new URL(linkUrl);
      // Only include next links within the same base path
      if (linkUrlObj.pathname.startsWith(basePath)) {
        links.add(linkUrl);
      }
    } catch {}
  }
  
  console.log(`Found ${links.size} pagination links within ${basePath}`);
  let fetched = 0;
  for (const pageUrl of links) {
    if (fetched >= maxPages) break;
    try {
      const result = await extractFromHtml(pageUrl, basePath);
      result.urls.forEach((v, k) => { if (!allUrls.has(k)) allUrls.set(k, v); });
      fetched++;
    } catch {}
  }
  return allUrls;
}

app.get('/api/extract', async (req, res) => {
  const { url, paginate = 'false', maxPages = '3' } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  const urls = new Map();
  const methods = [];
  const baseHostname = new URL(url).hostname;
  const basePath = new URL(url).pathname.replace(/\/[^\/]*$/, '/');
  
  const sitemap = await fetchSitemap(url);
  if (sitemap) {
    sitemap.forEach(u => { 
      try { 
        const sitemapUrl = new URL(u);
        // Only include sitemap URLs within the same base path
        if (sitemapUrl.hostname === baseHostname && sitemapUrl.pathname.startsWith(basePath)) {
          urls.set(u, {url: u, title: u});
        } 
      } catch {} 
    });
    methods.push('sitemap');
  }
  
  try {
    const result = await extractFromHtml(url, basePath);
    result.urls.forEach((v, k) => urls.set(k, v));
    methods.push('html');
    
    if (paginate === 'true') {
      const paginated = await fetchPagination(url, result.html, parseInt(maxPages, 10), basePath);
      paginated.forEach((v, k) => { if (!urls.has(k)) urls.set(k, v); });
      methods.push('pagination');
    }
  } catch (err) {
    console.error('Extract error:', err);
  }
  
  res.json({
    success: true,
    urls: Array.from(urls.values()),
    count: urls.size,
    methods,
  });
});

app.get('/api/convert', async (req, res) => {
  const { url, method, retain_images } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  try {
    const apiUrl = new URL(`${MARKDOWN_API_BASE}/${url}`);
    if (method) apiUrl.searchParams.append('method', method);
    if (retain_images === 'true') apiUrl.searchParams.append('retain_images', 'true');
    
    console.log('Converting:', apiUrl.toString());
    const response = await fetch(apiUrl.toString(), { headers: { 'Accept': 'text/markdown' } });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText });
    }
    
    const markdown = await response.text();
    const tokens = response.headers.get('x-markdown-tokens');
    const titleMatch = markdown.match(/^title:\s*(.+)$/m);
    
    res.json({
      success: true,
      url,
      title: titleMatch ? titleMatch[1].trim() : url,
      markdown,
      tokens: tokens ? parseInt(tokens, 10) : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

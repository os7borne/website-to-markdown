const MARKDOWN_API_BASE = 'https://markdown.new';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, method, retain_images } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  
  try {
    const apiUrl = new URL(`${MARKDOWN_API_BASE}/${url}`);
    if (method) apiUrl.searchParams.append('method', method);
    if (retain_images === 'true') apiUrl.searchParams.append('retain_images', 'true');
    
    console.log('Converting:', apiUrl.toString());
    const response = await fetch(apiUrl.toString(), { 
      headers: { 'Accept': 'text/markdown' } 
    });
    
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
}

import { useState, useCallback, useRef } from 'react';
import { extractUrls, convertUrls } from '../api/urlExtractor';

export function useUrlCrawler() {
  const [state, setState] = useState({
    status: 'idle', // idle | extracting | converting | complete | error
    progress: { current: 0, total: 0 },
    urls: [],
    results: [],
    error: null,
    currentUrl: null,
    methods: [],
  });

  const isCancelledRef = useRef(false);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    setState(prev => ({
      ...prev,
      status: 'idle',
    }));
  }, []);

  const start = useCallback(async (url, options = {}) => {
    isCancelledRef.current = false;

    // Step 1: Extract URLs
    setState({
      status: 'extracting',
      progress: { current: 0, total: 0 },
      urls: [],
      results: [],
      error: null,
      currentUrl: url,
    });

    let urls;
    let extractionMethods = [];
    try {
      const data = await extractUrls(url, {
        paginate: options.paginate,
        maxPages: options.maxPages,
      });
      urls = data.urls || data;
      extractionMethods = data.methods || [];
      
      if (isCancelledRef.current) return;

      // Limit the number of URLs
      const limit = options.limit || 50;
      if (urls.length > limit) {
        urls = urls.slice(0, limit);
      }

      console.log(`Found ${urls.length} URLs`);
    } catch (err) {
      if (isCancelledRef.current) return;
      
      // If extraction fails, just use the main URL
      console.error('URL extraction failed, using main URL:', err);
      urls = [{ url, title: url }];
    }

    setState(prev => ({
      ...prev,
      status: 'converting',
      urls,
      methods: extractionMethods,
      progress: { current: 0, total: urls.length },
    }));

    // Step 2: Convert URLs to markdown
    try {
      const results = await convertUrls(
        urls,
        (progress) => {
          if (isCancelledRef.current) return;
          setState(prev => ({
            ...prev,
            progress: { current: progress.current, total: progress.total },
            currentUrl: progress.url,
          }));
        },
        { method: options.method }
      );

      if (isCancelledRef.current) return;

      setState(prev => ({
        ...prev,
        status: 'complete',
        results,
        progress: { current: urls.length, total: urls.length },
      }));
    } catch (err) {
      if (isCancelledRef.current) return;
      setState(prev => ({
        ...prev,
        status: 'error',
        error: err.message,
      }));
    }
  }, []);

  return {
    ...state,
    start,
    cancel,
    isLoading: state.status === 'extracting' || state.status === 'converting',
  };
}

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

  // Start with automatic URL extraction (crawl mode)
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

    // Proceed to conversion
    await convertExtractedUrls(urls, extractionMethods, options);
  }, []);

  // Start with manually provided URLs (skip extraction)
  const startManual = useCallback(async (manualUrls, options = {}) => {
    isCancelledRef.current = false;

    if (!manualUrls || manualUrls.length === 0) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'No URLs provided',
      }));
      return;
    }

    // Skip extraction, go directly to conversion
    setState({
      status: 'converting',
      progress: { current: 0, total: manualUrls.length },
      urls: manualUrls,
      results: [],
      error: null,
      currentUrl: null,
      methods: ['manual'],
    });

    await convertExtractedUrls(manualUrls, ['manual'], options);
  }, []);

  // Shared conversion logic
  const convertExtractedUrls = async (urls, extractionMethods, options) => {
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
  };

  return {
    ...state,
    start,
    startManual,
    cancel,
    isLoading: state.status === 'extracting' || state.status === 'converting',
  };
}

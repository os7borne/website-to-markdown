import { useState } from 'react';
import { Globe, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export function UrlInput({ onStart, isLoading }) {
  const [url, setUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [paginate, setPaginate] = useState(false);
  const [maxPages, setMaxPages] = useState(3);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    let validatedUrl = url.trim();
    if (!/^https?:\/\//i.test(validatedUrl)) {
      validatedUrl = `https://${validatedUrl}`;
    }

    try {
      new URL(validatedUrl);
      onStart(validatedUrl, { 
        limit, 
        paginate,
        maxPages: parseInt(maxPages, 10),
      });
    } catch {
      setError('Please enter a valid URL');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
            Max Pages: {limit}
          </label>
          <input
            type="range"
            id="limit"
            min="1"
            max="500"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>500</span>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          disabled={isLoading}
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide advanced options
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show advanced options
            </>
          )}
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="bg-gray-50 rounded-md p-4 space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="paginate"
                  type="checkbox"
                  checked={paginate}
                  onChange={(e) => setPaginate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="paginate" className="font-medium text-gray-700">
                  Follow pagination links
                </label>
                <p className="text-gray-500">
                  Follow "Next page", "Load more" links to find additional pages
                </p>
              </div>
            </div>

            {paginate && (
              <div>
                <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-1">
                  Max pagination pages to fetch: {maxPages}
                </label>
                <input
                  type="range"
                  id="maxPages"
                  min="1"
                  max="10"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Starting...
            </>
          ) : (
            'Start Crawl'
          )}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Link2, Trash2, Loader2, FileText } from 'lucide-react';

export function ManualUrlInput({ onStart, isLoading }) {
  const [urls, setUrls] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (url) => {
    if (!url.trim()) return null;
    
    let validatedUrl = url.trim();
    if (!/^https?:\/\//i.test(validatedUrl)) {
      validatedUrl = `https://${validatedUrl}`;
    }

    try {
      new URL(validatedUrl);
      return validatedUrl;
    } catch {
      return null;
    }
  };

  const handleAddUrl = () => {
    setError('');
    
    const validatedUrl = validateUrl(currentUrl);
    if (!validatedUrl) {
      setError('Please enter a valid URL');
      return;
    }

    // Check for duplicates
    if (urls.some(u => u.url === validatedUrl)) {
      setError('This URL has already been added');
      return;
    }

    setUrls([...urls, { url: validatedUrl, title: validatedUrl }]);
    setCurrentUrl('');
  };

  const handleRemoveUrl = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const handleStart = () => {
    if (urls.length === 0) {
      setError('Please add at least one URL');
      return;
    }
    onStart(urls);
  };

  const handleClear = () => {
    setUrls([]);
    setError('');
  };

  const handlePaste = (e) => {
    // Handle pasting multiple URLs (one per line)
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length > 1) {
      e.preventDefault();
      const newUrls = [];
      const duplicates = [];
      const invalids = [];

      lines.forEach(line => {
        const validatedUrl = validateUrl(line);
        if (!validatedUrl) {
          invalids.push(line);
          return;
        }
        if (urls.some(u => u.url === validatedUrl) || newUrls.some(u => u.url === validatedUrl)) {
          duplicates.push(line);
          return;
        }
        newUrls.push({ url: validatedUrl, title: validatedUrl });
      });

      if (newUrls.length > 0) {
        setUrls([...urls, ...newUrls]);
      }

      // Show feedback
      let feedback = [];
      if (newUrls.length > 0) feedback.push(`Added ${newUrls.length} URL(s)`);
      if (duplicates.length > 0) feedback.push(`${duplicates.length} duplicate(s) skipped`);
      if (invalids.length > 0) feedback.push(`${invalids.length} invalid URL(s) skipped`);
      
      if (feedback.length > 0) {
        setError(feedback.join(' • '));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Add URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add URLs individually
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="https://example.com/page"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={isLoading || !currentUrl.trim()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Tip: You can paste multiple URLs (one per line) to add them all at once
          </p>
        </div>

        {/* URL List */}
        {urls.length > 0 && (
          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {urls.length} URL{urls.length !== 1 ? 's' : ''} to convert
              </span>
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {urls.map((item, index) => (
                <div
                  key={item.url}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center min-w-0">
                    <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate" title={item.url}>
                        {item.url}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(index)}
                    disabled={isLoading}
                    className="ml-2 text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className={`text-sm px-3 py-2 rounded ${error.includes('Added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={isLoading || urls.length === 0}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Converting...
            </>
          ) : (
            `Convert ${urls.length > 0 ? urls.length : ''} URL${urls.length === 1 ? '' : 's'} to Markdown`
          )}
        </button>
      </div>
    </div>
  );
}

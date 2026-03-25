import { useState } from 'react';
import { useUrlCrawler } from './hooks/useUrlCrawler';
import { UrlInput } from './components/UrlInput';
import { ManualUrlInput } from './components/ManualUrlInput';
import { CrawlProgress } from './components/CrawlProgress';
import { ResultsList } from './components/ResultsList';
import { FileText, Globe, ListPlus } from 'lucide-react';

function App() {
  const { status, progress, results, error, urls, currentUrl, methods, start, startManual, cancel, isLoading } = useUrlCrawler();
  const [activeTab, setActiveTab] = useState('crawl'); // 'crawl' | 'manual'

  const showProgress = status === 'extracting' || status === 'converting' || status === 'complete' || status === 'error';
  const showResults = results.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Website to Markdown
          </h1>
          <p className="text-gray-600">
            Convert any website to Markdown. Crawl pages automatically or add URLs manually.
          </p>
        </div>

        {/* Tabs */}
        {!isLoading && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('crawl')}
                  className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'crawl'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Auto Crawl
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'manual'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add URLs Manually
                </button>
              </div>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="mb-6">
          {activeTab === 'crawl' ? (
            <UrlInput onStart={start} isLoading={isLoading} />
          ) : (
            <ManualUrlInput onStart={startManual} isLoading={isLoading} />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Progress */}
        {showProgress && (
          <div className="mb-6">
            <CrawlProgress
              status={status}
              progress={progress}
              urls={urls}
              currentUrl={currentUrl}
              methods={methods}
              onCancel={cancel}
            />
          </div>
        )}

        {/* Results */}
        {showResults && (
          <ResultsList results={results} />
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by <a href="https://markdown.new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">markdown.new</a></p>
        </div>
      </div>
    </div>
  );
}

export default App;

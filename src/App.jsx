import { useUrlCrawler } from './hooks/useUrlCrawler';
import { UrlInput } from './components/UrlInput';
import { CrawlProgress } from './components/CrawlProgress';
import { ResultsList } from './components/ResultsList';
import { FileText } from 'lucide-react';

function App() {
  const { status, progress, results, error, urls, currentUrl, methods, start, cancel, isLoading } = useUrlCrawler();

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
            Convert any website to Markdown. Enter a URL and we'll crawl all pages.
          </p>
        </div>

        {/* URL Input */}
        <div className="mb-6">
          <UrlInput onStart={start} isLoading={isLoading} />
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

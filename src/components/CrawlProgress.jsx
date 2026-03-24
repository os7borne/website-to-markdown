import { Loader2, CheckCircle, XCircle, Search, FileText } from 'lucide-react';

export function CrawlProgress({ status, progress, urls, currentUrl, onCancel, methods = [] }) {
  const { current, total } = progress;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'extracting':
        return <Search className="animate-pulse h-5 w-5 text-blue-500 mr-2" />;
      case 'converting':
        return <Loader2 className="animate-spin h-5 w-5 text-blue-500 mr-2" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500 mr-2" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500 mr-2" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'extracting':
        return methods.includes('pagination') 
          ? 'Finding pages (following pagination)...' 
          : 'Finding pages...';
      case 'converting':
        return `Converting page ${current} of ${total}`;
      case 'complete':
        return `Complete! ${total} pages converted`;
      case 'error':
        return 'Conversion failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'error':
        return 'bg-red-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <h3 className="text-lg font-medium text-gray-900">
            {getStatusText()}
          </h3>
        </div>
        {(status === 'extracting' || status === 'converting') && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'converting' || status === 'complete') && total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{current} of {total} pages</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Current URL */}
      {currentUrl && status === 'converting' && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-start">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
              <p className="text-sm text-gray-700 truncate">{currentUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* URLs found count */}
      {status === 'extracting' && urls.length > 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Found {urls.length} pages so far...
        </p>
      )}

      {urls.length > 0 && status !== 'extracting' && (
        <p className="text-xs text-gray-500 mt-2">
          {urls.length} pages total
        </p>
      )}
    </div>
  );
}

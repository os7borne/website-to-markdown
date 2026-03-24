import { useState, useMemo } from 'react';
import { Download, Eye, Copy, FileArchive, Check } from 'lucide-react';
import { downloadFile, downloadAsZip, copyToClipboard, generateFilename } from '../utils/download';

export function ResultsList({ results }) {
  const [copiedId, setCopiedId] = useState(null);
  const [previewPage, setPreviewPage] = useState(null);

  const zipName = useMemo(() => {
    if (results.length === 0) return 'markdown-files.zip';
    try {
      const url = new URL(results[0].url);
      const hostname = url.hostname.replace(/[^a-zA-Z0-9]/g, '-');
      const date = new Date().toISOString().split('T')[0];
      return `${hostname}-${date}.zip`;
    } catch {
      return 'markdown-files.zip';
    }
  }, [results]);

  const handleDownload = (page, index) => {
    const filename = generateFilename(page.url, page.title, index + 1);
    downloadFile(page.markdown, filename);
  };

  const handleDownloadAll = async () => {
    await downloadAsZip(results, zipName);
  };

  const handleCopy = async (page, index) => {
    const success = await copyToClipboard(page.markdown);
    if (success) {
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Results ({results.length} pages)
        </h3>
        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FileArchive className="h-4 w-4 mr-1.5" />
          Download All
        </button>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {results.map((page, index) => (
          <div
            key={index}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {page.title || 'Untitled Page'}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {page.url}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPreviewPage(page)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCopy(page, index)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Copy to clipboard"
                >
                  {copiedId === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDownload(page, index)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewPage && (
        <MarkdownPreview
          page={previewPage}
          onClose={() => setPreviewPage(null)}
        />
      )}
    </div>
  );
}

function MarkdownPreview({ page, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(page.markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl w-full max-w-4xl">
            {/* Header */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {page.title || 'Preview'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {page.url}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="bg-gray-50 px-4 py-4">
              <pre className="bg-white rounded-lg p-4 overflow-auto max-h-96 text-sm text-gray-800 whitespace-pre-wrap border border-gray-200">
                {page.markdown}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

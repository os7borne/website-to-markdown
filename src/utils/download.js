import JSZip from 'jszip';

/**
 * Download a single file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a safe filename from URL and title
 * @param {string} url - Page URL
 * @param {string} title - Page title
 * @param {number} index - Page index
 * @returns {string} - Safe filename
 */
export function generateFilename(url, title, index) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-');
    const path = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Use title if available, otherwise use URL path
    let name = title ? title.trim() : path || 'index';
    name = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    
    return `${index.toString().padStart(3, '0')}-${hostname}-${name}.md`;
  } catch {
    return `${index.toString().padStart(3, '0')}-page.md`;
  }
}

/**
 * Download multiple files as a ZIP archive
 * @param {Array} pages - Array of {url, title, markdown} objects
 * @param {string} zipName - ZIP file name
 */
export async function downloadAsZip(pages, zipName) {
  const zip = new JSZip();
  
  pages.forEach((page, index) => {
    const filename = generateFilename(page.url, page.title, index + 1);
    zip.file(filename, page.markdown);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  downloadFile(content, zipName, 'application/zip');
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

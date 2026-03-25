# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Vercel deployment support with serverless functions
  - Added `vercel.json` configuration file
  - Created `api/extract.js` serverless function for URL extraction
  - Created `api/convert.js` serverless function for markdown conversion
- Environment variable support for API base URL (`VITE_API_URL`)
- Added `.env.example` for environment configuration reference

### Changed
- Updated `src/api/urlExtractor.js` to use `VITE_API_URL` environment variable with fallback to `/api`

## [1.0.0] - 2024-03-24

### Added
- Initial release of Website to Markdown Converter
- URL extraction from sitemaps and HTML parsing
- Support for pagination crawling
- Batch URL to Markdown conversion
- Progress tracking UI with status indicators
- Download results as individual Markdown files or ZIP archive
- Built-in proxy server to handle CORS and external API calls
- Integration with [markdown.new](https://markdown.new) for URL-to-Markdown conversion
- React-based frontend with Tailwind CSS styling
- Express.js backend with `/api/extract` and `/api/convert` endpoints

### Technical
- React 19 with Vite build system
- Express 5 with CORS support
- Client-side routing with React Router
- Lucide React for icons
- JSZip for ZIP file generation

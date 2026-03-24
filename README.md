# Website to Markdown Converter

A web app that converts websites to Markdown by crawling pages and using [markdown.new](https://markdown.new) API.

## Features

- Extract URLs from any website (same domain)
- Convert each page to clean Markdown
- Download individual files or all as ZIP
- Preview Markdown before downloading
- Real-time progress tracking

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js proxy server (avoids CORS issues)
- **API**: markdown.new for Markdown conversion

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build and run

```bash
# Build frontend and start server
npm start
```

Or separately:

```bash
# Build frontend
npm run build

# Start server
npm run server
```

### 3. Open in browser

Visit: http://localhost:3000

## How It Works

1. User enters a URL
2. Backend extracts all same-domain links from the page
3. Backend calls markdown.new API for each URL (no CORS issues)
4. Results are displayed with download options

## API Endpoints

The Express server provides these endpoints:

- `GET /api/extract?url=https://example.com` - Extract URLs from a page
- `GET /api/convert?url=https://example.com` - Convert single URL to Markdown
- `POST /api/crawl` - Start a crawl job (legacy)
- `GET /api/crawl/status/:jobId` - Get crawl status (legacy)

## Development

```bash
# Run frontend dev server (port 5173)
npm run dev

# In another terminal, run backend server (port 3000)
npm run server
```

## Why a Backend?

The markdown.new API doesn't support CORS from browser origins. The Express proxy server:
- Handles all API calls server-side (no CORS issues)
- Extracts URLs using server-side HTTP requests
- Serves the static frontend files

## License

MIT

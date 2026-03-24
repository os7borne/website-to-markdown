# Website to Markdown Converter - Implementation Plan

## Overview
A frontend-only Vite + React application that converts websites to Markdown using the markdown.new API.

## Tech Stack
- Vite + React + Tailwind CSS
- JSZip for ZIP generation
- Lucide React for icons

## Project Structure
```
src/
├── components/
│   ├── UrlInput.jsx
│   ├── CrawlProgress.jsx
│   ├── ResultsList.jsx
│   └── MarkdownPreview.jsx
├── hooks/
│   └── useCrawlJob.js
├── api/
│   └── markdownApi.js
├── utils/
│   └── download.js
├── App.jsx
├── main.jsx
└── index.css
```

See full plan in system plan file.

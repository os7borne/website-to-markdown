# Website to Markdown Converter - Implementation Plan

## Overview
A Vite + React application that converts websites to Markdown using the markdown.new API. Hosted on Vercel with Firebase backend for change detection.

---

## 🆕 Change Detection Feature Plan (Simplified)

### Goal
Monitor individual web pages for content changes over time by comparing markdown snapshots.

### Architecture (Vercel + Firebase)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Vercel        │      │   Firebase      │      │   markdown.new  │
│   (Frontend)    │◄────►│   Firestore     │◄────►│   (Conversion)  │
│   React App     │      │   (Database)    │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Vercel        │
│   API Routes    │
│   (Serverless)  │
└─────────────────┘
```

### Why Firebase?
- **Vercel compatible** - Works with serverless functions
- **Real-time** - Live updates when changes detected
- **Simple** - No server management
- **Free tier** - Generous limits for personal use
- **Auth ready** - Can add user accounts later

### Database Schema (Firestore)

```javascript
// Collection: monitored_urls
// Document ID: hash of normalized URL
{
  url: "https://example.com/blog/post-1",
  normalizedUrl: "example.com/blog/post-1",
  title: "Blog Post Title",
  createdAt: timestamp,
  lastCheckedAt: timestamp,
  checkFrequency: "daily", // daily, weekly, manual
  
  // Latest snapshot (embedded for quick access)
  latestSnapshot: {
    markdown: "# Title\n\nContent...",
    hash: "sha256-hash",
    capturedAt: timestamp,
    tokens: 1250
  }
}

// Collection: snapshots
// Subcollection under monitored_urls/{urlId}/snapshots
// Document ID: auto-generated with timestamp
{
  markdown: "# Title\n\nContent...",
  hash: "sha256-hash",
  capturedAt: timestamp,
  tokens: 1250,
  changeType: "added" | "modified" | "unchanged"
}

// Collection: changes (for history/feed)
// Document ID: auto-generated
{
  urlId: "reference-to-monitored-url",
  url: "https://example.com/blog/post-1",
  title: "Blog Post Title",
  
  changeType: "modified", // added, modified, removed
  oldHash: "hash-of-previous",
  newHash: "hash-of-current",
  
  // Change summary (not full content)
  summary: {
    oldTitle: "Old Title",
    newTitle: "New Title",
    tokensChanged: 150,
    percentChanged: 12
  },
  
  detectedAt: timestamp,
  
  // Full content only stored if user wants history
  includeContent: true,
  oldContent: "...", // optional
  newContent: "..."  // optional
}
```

### Core Logic

```javascript
// utils/changeDetection.js

/**
 * Generate hash for markdown content
 */
function generateHash(markdown) {
  // Simple hash - first 100 chars of sha256
  return sha256(markdown).substring(0, 16);
}

/**
 * Check single URL for changes
 */
async function checkUrlForChanges(url, db) {
  // 1. Get current snapshot from Firebase
  const urlDoc = await db.collection('monitored_urls').doc(hashUrl(url)).get();
  const previous = urlDoc.exists ? urlDoc.data().latestSnapshot : null;
  
  // 2. Fetch new markdown
  const { markdown, title, tokens } = await convertUrlToMarkdown(url);
  const currentHash = generateHash(markdown);
  
  // 3. Compare
  if (!previous) {
    // First time monitoring
    return { 
      changeType: 'added', 
      isNew: true,
      snapshot: { markdown, hash: currentHash, title, tokens }
    };
  }
  
  if (previous.hash === currentHash) {
    // No change
    return { 
      changeType: 'unchanged',
      isNew: false 
    };
  }
  
  // 4. Changed!
  return {
    changeType: 'modified',
    isNew: false,
    previous,
    current: { markdown, hash: currentHash, title, tokens },
    summary: {
      oldTitle: previous.title,
      newTitle: title,
      tokensChanged: tokens - previous.tokens,
      percentChanged: calculatePercentChange(previous.markdown, markdown)
    }
  };
}

/**
 * Save check result to Firebase
 */
async function saveCheckResult(url, result, db) {
  const urlId = hashUrl(url);
  const batch = db.batch();
  
  if (result.isNew || result.changeType === 'modified') {
    // Update monitored_urls with latest snapshot
    const urlRef = db.collection('monitored_urls').doc(urlId);
    batch.set(urlRef, {
      url,
      normalizedUrl: normalizeUrl(url),
      title: result.snapshot?.title || result.current?.title,
      lastCheckedAt: FieldValue.serverTimestamp(),
      latestSnapshot: {
        markdown: result.snapshot?.markdown || result.current?.markdown,
        hash: result.snapshot?.hash || result.current?.hash,
        capturedAt: FieldValue.serverTimestamp(),
        tokens: result.snapshot?.tokens || result.current?.tokens
      }
    }, { merge: true });
    
    // Add to snapshots subcollection
    const snapshotRef = urlRef.collection('snapshots').doc();
    batch.set(snapshotRef, {
      markdown: result.snapshot?.markdown || result.current?.markdown,
      hash: result.snapshot?.hash || result.current?.hash,
      capturedAt: FieldValue.serverTimestamp(),
      tokens: result.snapshot?.tokens || result.current?.tokens,
      changeType: result.changeType
    });
    
    // Add to changes collection (for feed/notifications)
    if (result.changeType === 'modified') {
      const changeRef = db.collection('changes').doc();
      batch.set(changeRef, {
        urlId,
        url,
        title: result.current.title,
        changeType: 'modified',
        oldHash: result.previous.hash,
        newHash: result.current.hash,
        summary: result.summary,
        detectedAt: FieldValue.serverTimestamp()
      });
    }
  } else {
    // Just update lastCheckedAt
    const urlRef = db.collection('monitored_urls').doc(urlId);
    batch.update(urlRef, {
      lastCheckedAt: FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  return result;
}
```

### Vercel API Routes

```
api/
├── check-url.js          # POST - Check single URL for changes
├── monitor-url.js        # POST - Add URL to monitoring
├── unmonitor-url.js      # POST - Remove URL from monitoring
├── get-monitored.js      # GET - List user's monitored URLs
├── get-changes.js        # GET - Get change history
└── cron-check.js         # Cron - Automated daily checks
```

```javascript
// api/check-url.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  
  try {
    const result = await checkUrlForChanges(url, db);
    await saveCheckResult(url, result, db);
    
    res.json({
      success: true,
      changeType: result.changeType,
      hasChanged: result.changeType === 'modified' || result.isNew,
      summary: result.summary || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

### UI Components (Simplified)

#### 1. MonitorButton.jsx
Simple toggle to start/stop monitoring a page
```jsx
<MonitorButton 
  url={page.url} 
  isMonitored={isMonitored}
  onToggle={handleToggle}
/>
```

#### 2. ChangesFeed.jsx
List of recent changes across all monitored pages
```
┌─────────────────────────────────────────┐
│ Recent Changes                          │
├─────────────────────────────────────────┤
│ 🟢 Blog Post 1                    2h ago│
│    Modified: +150 tokens                │
│                                         │
│ 🟢 Pricing Page                   5h ago│
│    Title changed                        │
│                                         │
│ 🔴 Old Article                   1d ago │
│    Page removed (404)                   │
└─────────────────────────────────────────┘
```

#### 3. PageHistory.jsx
History of a specific page
- List all snapshots
- Show diff between versions
- "Restore" old version

### Cron Job (Vercel)

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron-check",
      "schedule": "0 9 * * *" // Daily at 9 AM
    }
  ]
}
```

```javascript
// api/cron-check.js
export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get all URLs due for check
  const urls = await getUrlsDueForCheck(db);
  
  // Check each URL
  const results = [];
  for (const urlDoc of urls) {
    try {
      const result = await checkUrlForChanges(urlDoc.url, db);
      await saveCheckResult(urlDoc.url, result, db);
      results.push({ url: urlDoc.url, changeType: result.changeType });
    } catch (err) {
      results.push({ url: urlDoc.url, error: err.message });
    }
    
    // Rate limiting - wait between requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  res.json({ checked: results.length, results });
}
```

### Simplified Data Flow

```
User clicks "Monitor" on a page
       ↓
Save URL to Firebase with initial snapshot
       ↓
Daily cron job runs
       ↓
For each monitored URL:
   ├── Fetch current markdown
   ├── Compare hash with stored snapshot
   ├── If different: Save new snapshot + record change
   └── Update lastCheckedAt
       ↓
User views Changes feed
       ↓
Show only URLs with detected changes
```

### Key Features (MVP)

1. **Monitor Toggle** - One-click start/stop monitoring any page
2. **Change Feed** - List of all detected changes with timestamps
3. **Basic Diff** - Show line-by-line changes between versions
4. **Manual Check** - "Check Now" button for immediate verification
5. **History** - View all previous versions of a page

### Out of Scope (for MVP)

- ❌ Screenshots/image comparison (too complex)
- ❌ Full website monitoring (per-page only)
- ❌ Email notifications (use Firebase for this later)
- ❌ Complex scheduling (just daily for now)
- ❌ User authentication (public/shared data initially)

### Firebase Costs

**Free Tier (Spark)**:
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1GB storage

**Estimated usage**:
- 100 monitored URLs × 1 check/day = 3K reads/day
- 100 writes for new snapshots = 3K writes/day
- Well within free tier

---

## Original Implementation Plan

## Tech Stack
- **Build Tool**: Vite (fast dev server, optimized builds)
- **Framework**: React 18+ (hooks for state management)
- **Styling**: Tailwind CSS (minimal, utility-first)
- **ZIP Generation**: JSZip (client-side zip creation)
- **File Download**: FileSaver.js or native Blob API
- **Icons**: Lucide React (minimal, clean icons)
- **Backend**: Firebase Firestore (change detection)
- **Hosting**: Vercel

## Project Structure

```
website-to-markdown/
├── api/                    # Vercel serverless functions
│   ├── check-url.js
│   ├── monitor-url.js
│   ├── unmonitor-url.js
│   ├── get-monitored.js
│   ├── get-changes.js
│   └── cron-check.js
├── src/
│   ├── components/
│   │   ├── UrlInput.jsx
│   │   ├── CrawlProgress.jsx
│   │   ├── ResultsList.jsx
│   │   ├── MarkdownPreview.jsx
│   │   ├── MonitorButton.jsx      # NEW
│   │   ├── ChangesFeed.jsx        # NEW
│   │   └── PageHistory.jsx        # NEW
│   ├── hooks/
│   │   ├── useUrlCrawler.js
│   │   ├── useMonitoring.js       # NEW
│   │   └── useChanges.js          # NEW
│   ├── api/
│   │   ├── urlExtractor.js
│   │   └── firebase.js            # NEW
│   ├── utils/
│   │   ├── download.js
│   │   └── changeDetection.js     # NEW
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── vercel.json              # Cron config
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "jszip": "^3.10.1",
    "lucide-react": "^0.300.0",
    "firebase": "^10.0.0",
    "diff-match-patch": "^1.0.5"
  }
}
```

---

**Plan Location**: `/Library/WebServer/Documents/projects/website-to-markdown/PLAN.md`

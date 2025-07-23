# Smart Bookmarks Extension

A Chrome extension with AI-powered semantic search for bookmarks using MCP (Model Context Protocol) backend.

## Features

- **Semantic Search**: AI-powered search using OpenAI embeddings
- **Keyword Search**: Traditional text-based search fallback
- **Content Extraction**: Automatically extracts page content when bookmarking
- **MCP Integration**: Backend server implementing Model Context Protocol
- **Real-time Indexing**: Bookmarks are indexed automatically when added/modified

## Architecture

### Chrome Extension
- **Manifest V3** compliance
- **Popup UI** for search interface
- **Background Script** for bookmark management
- **Content Script** for page content extraction

### MCP Server
- **Express.js** REST API
- **SQLite** database for bookmark storage
- **OpenAI** embeddings for semantic search
- **MCP SDK** for protocol compliance

## Setup

### 1. Install Dependencies

```bash
npm install
npm run install:server
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp mcp-server/.env.example mcp-server/.env
```

Edit `mcp-server/.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### 3. Start MCP Server

```bash
npm run dev:server
```

### 4. Load Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

## Usage

### Search Bookmarks

1. Click the extension icon in Chrome toolbar
2. Type your search query
3. Choose between "Semantic" or "Keyword" search
4. Click on results to open bookmarks

### Semantic Search

Uses AI to understand the meaning of your search query and finds relevant bookmarks even if they don't contain exact keywords.

### Keyword Search

Traditional text-based search through bookmark titles, URLs, and extracted content.

## API Endpoints

The MCP server provides the following endpoints:

- `POST /search` - Search bookmarks
- `POST /index` - Index a bookmark
- `POST /content` - Extract content from URL
- `POST /remove` - Remove bookmark from index
- `GET /health` - Server health check

## MCP Tools

When running as an MCP server, provides these tools:

- `search_bookmarks` - Search bookmarks using semantic or keyword search
- `index_bookmark` - Index a bookmark for semantic search
- `extract_content` - Extract content from a URL

## Development

### Build Extension
```bash
npm run build:extension
```

### Build Server
```bash
npm run build:server
```

### Clean Build
```bash
npm run clean
```

## Database Schema

The SQLite database stores:
- Bookmark metadata (title, URL, date)
- Extracted content
- OpenAI embeddings for semantic search
- Indexing timestamps

## Security

- No API keys stored in extension
- All AI processing happens on MCP server
- Content extraction respects robots.txt
- Bookmark data stored locally

## License

MIT
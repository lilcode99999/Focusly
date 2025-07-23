import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { BookmarkSearchEngine } from './bookmark-search.js';
import { ContentExtractor } from './content-extractor.js';

dotenv.config();

class SmartBookmarksMCPServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.searchEngine = new BookmarkSearchEngine();
    this.contentExtractor = new ContentExtractor();
    
    this.setupExpress();
    this.setupMCP();
  }
  
  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    
    this.app.post('/search', async (req, res) => {
      try {
        const { query, type } = req.body;
        const results = await this.searchEngine.search(query, type);
        res.json({ results });
      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/index', async (req, res) => {
      try {
        const bookmark = req.body;
        await this.searchEngine.indexBookmark(bookmark);
        res.json({ success: true });
      } catch (error) {
        console.error('Index error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/content', async (req, res) => {
      try {
        const { url } = req.body;
        const content = await this.contentExtractor.extractContent(url);
        res.json({ content });
      } catch (error) {
        console.error('Content extraction error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/remove', async (req, res) => {
      try {
        const { id } = req.body;
        await this.searchEngine.removeBookmark(id);
        res.json({ success: true });
      } catch (error) {
        console.error('Remove error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }
  
  setupMCP() {
    const server = new Server(
      {
        name: 'smart-bookmarks-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_bookmarks',
            description: 'Search bookmarks using semantic or keyword search',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query'
                },
                type: {
                  type: 'string',
                  enum: ['semantic', 'keyword'],
                  description: 'Type of search to perform'
                }
              },
              required: ['query', 'type']
            }
          },
          {
            name: 'index_bookmark',
            description: 'Index a bookmark for semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                url: { type: 'string' },
                dateAdded: { type: 'number' }
              },
              required: ['id', 'title', 'url']
            }
          },
          {
            name: 'extract_content',
            description: 'Extract content from a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' }
              },
              required: ['url']
            }
          }
        ]
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'search_bookmarks':
            const results = await this.searchEngine.search(args.query, args.type);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2)
                }
              ]
            };
            
          case 'index_bookmark':
            await this.searchEngine.indexBookmark(args);
            return {
              content: [
                {
                  type: 'text',
                  text: 'Bookmark indexed successfully'
                }
              ]
            };
            
          case 'extract_content':
            const content = await this.contentExtractor.extractContent(args.url);
            return {
              content: [
                {
                  type: 'text',
                  text: content
                }
              ]
            };
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    const transport = new StdioServerTransport();
    server.connect(transport);
    
    console.log('MCP server running on stdio');
  }
  
  async start() {
    await this.searchEngine.initialize();
    
    this.app.listen(this.port, () => {
      console.log(`Smart Bookmarks MCP Server running on port ${this.port}`);
    });
  }
}

const server = new SmartBookmarksMCPServer();
server.start().catch(console.error);
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class BookmarkSearchEngine {
  constructor() {
    this.db = null;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async initialize() {
    this.db = await open({
      filename: './bookmarks.db',
      driver: sqlite3.Database
    });
    
    await this.createTables();
  }
  
  async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        title TEXT,
        url TEXT,
        content TEXT,
        embedding BLOB,
        date_added INTEGER,
        date_indexed INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_title ON bookmarks(title);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_date_added ON bookmarks(date_added);
    `);
  }
  
  async indexBookmark(bookmark) {
    try {
      const existingBookmark = await this.db.get(
        'SELECT id FROM bookmarks WHERE id = ?',
        [bookmark.id]
      );
      
      if (existingBookmark) {
        await this.updateBookmark(bookmark);
      } else {
        await this.insertBookmark(bookmark);
      }
    } catch (error) {
      console.error('Error indexing bookmark:', error);
      throw error;
    }
  }
  
  async insertBookmark(bookmark) {
    const embedding = await this.generateEmbedding(bookmark.title + ' ' + bookmark.url);
    
    await this.db.run(`
      INSERT INTO bookmarks (id, title, url, content, embedding, date_added, date_indexed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      bookmark.id,
      bookmark.title,
      bookmark.url,
      bookmark.content || '',
      JSON.stringify(embedding),
      bookmark.dateAdded || Date.now(),
      Date.now()
    ]);
  }
  
  async updateBookmark(bookmark) {
    const embedding = await this.generateEmbedding(bookmark.title + ' ' + bookmark.url);
    
    await this.db.run(`
      UPDATE bookmarks 
      SET title = ?, url = ?, content = ?, embedding = ?, date_indexed = ?
      WHERE id = ?
    `, [
      bookmark.title,
      bookmark.url,
      bookmark.content || '',
      JSON.stringify(embedding),
      Date.now(),
      bookmark.id
    ]);
  }
  
  async removeBookmark(id) {
    await this.db.run('DELETE FROM bookmarks WHERE id = ?', [id]);
  }
  
  async search(query, type = 'semantic') {
    if (type === 'semantic') {
      return await this.semanticSearch(query);
    } else {
      return await this.keywordSearch(query);
    }
  }
  
  async semanticSearch(query) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const bookmarks = await this.db.all('SELECT * FROM bookmarks WHERE embedding IS NOT NULL');
      
      const results = bookmarks.map(bookmark => {
        const bookmarkEmbedding = JSON.parse(bookmark.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, bookmarkEmbedding);
        
        return {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          dateAdded: bookmark.date_added,
          similarity: similarity
        };
      });
      
      return results
        .filter(result => result.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20);
    } catch (error) {
      console.error('Semantic search error:', error);
      return await this.keywordSearch(query);
    }
  }
  
  async keywordSearch(query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const searchPattern = searchTerms.map(term => `%${term}%`).join('');
    
    const results = await this.db.all(`
      SELECT id, title, url, date_added as dateAdded
      FROM bookmarks 
      WHERE LOWER(title) LIKE ? OR LOWER(url) LIKE ? OR LOWER(content) LIKE ?
      ORDER BY date_added DESC
      LIMIT 20
    `, [searchPattern, searchPattern, searchPattern]);
    
    return results;
  }
  
  async generateEmbedding(text) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
  
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  async getAllBookmarks() {
    return await this.db.all('SELECT * FROM bookmarks ORDER BY date_added DESC');
  }
  
  async getBookmarkById(id) {
    return await this.db.get('SELECT * FROM bookmarks WHERE id = ?', [id]);
  }
}
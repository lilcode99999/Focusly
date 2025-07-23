import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export class ContentExtractor {
  constructor() {
    this.timeout = 10000;
    this.maxContentLength = 10000;
  }
  
  async extractContent(url) {
    try {
      const response = await fetch(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const content = this.extractTextContent($);
      const metadata = this.extractMetadata($);
      
      return {
        text: content.substring(0, this.maxContentLength),
        metadata: metadata,
        url: url,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Content extraction failed for ${url}:`, error);
      return {
        text: '',
        metadata: {},
        url: url,
        error: error.message,
        extractedAt: new Date().toISOString()
      };
    }
  }
  
  extractTextContent($) {
    $('script, style, noscript, iframe, nav, footer, header, aside, .advertisement, .ads, .social-share').remove();
    
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.main-content'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text().trim();
        break;
      }
    }
    
    if (!content) {
      content = $('body').text().trim();
    }
    
    return this.cleanText(content);
  }
  
  extractMetadata($) {
    const metadata = {};
    
    metadata.title = $('title').text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="title"]').attr('content') || '';
    
    metadata.description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="twitter:description"]').attr('content') || '';
    
    metadata.keywords = $('meta[name="keywords"]').attr('content') || '';
    
    metadata.author = $('meta[name="author"]').attr('content') || 
                     $('meta[property="article:author"]').attr('content') || 
                     $('.author').text().trim() || '';
    
    metadata.publishDate = $('meta[property="article:published_time"]').attr('content') || 
                          $('meta[name="date"]').attr('content') || 
                          $('time[datetime]').attr('datetime') || '';
    
    metadata.lang = $('html').attr('lang') || 
                   $('meta[http-equiv="content-language"]').attr('content') || '';
    
    metadata.canonical = $('link[rel="canonical"]').attr('href') || '';
    
    metadata.headings = [];
    $('h1, h2, h3').each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        metadata.headings.push({
          level: parseInt(el.tagName.substring(1)),
          text: text
        });
      }
    });
    
    metadata.images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt');
      if (src) {
        metadata.images.push({ src, alt: alt || '' });
      }
    });
    
    metadata.links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && !href.startsWith('#')) {
        metadata.links.push({ href, text });
      }
    });
    
    return metadata;
  }
  
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/\t+/g, ' ')
      .trim();
  }
  
  async extractMultipleUrls(urls) {
    const results = await Promise.allSettled(
      urls.map(url => this.extractContent(url))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: urls[index],
          error: result.reason.message,
          extractedAt: new Date().toISOString()
        };
      }
    });
  }
}
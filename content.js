class BookmarkContentExtractor {
  constructor() {
    this.isProcessing = false;
    this.extractedContent = null;
    this.init();
  }
  
  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractContent') {
        this.extractPageContent().then(content => {
          sendResponse({ content });
        }).catch(error => {
          sendResponse({ error: error.message });
        });
        return true;
      } else if (request.action === 'playNotificationSound') {
        this.playNotificationSound(request.soundType);
        sendResponse({ success: true });
      }
    });
    
    this.extractPageContent();
  }
  
  async extractPageContent() {
    if (this.isProcessing) return this.extractedContent;
    
    this.isProcessing = true;
    
    try {
      const content = {
        url: window.location.href,
        title: document.title,
        description: this.getMetaDescription(),
        keywords: this.getMetaKeywords(),
        content: this.getMainContent(),
        headings: this.getHeadings(),
        images: this.getImages(),
        links: this.getLinks(),
        author: this.getAuthor(),
        publishDate: this.getPublishDate(),
        lang: document.documentElement.lang,
        extractedAt: new Date().toISOString()
      };
      
      this.extractedContent = content;
      
      chrome.runtime.sendMessage({
        action: 'contentExtracted',
        content: content
      });
      
      return content;
    } catch (error) {
      console.error('Content extraction failed:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }
  
  getMetaDescription() {
    const descriptionMeta = document.querySelector('meta[name="description"]') ||
                           document.querySelector('meta[property="og:description"]') ||
                           document.querySelector('meta[name="twitter:description"]');
    return descriptionMeta ? descriptionMeta.getAttribute('content') : '';
  }
  
  getMetaKeywords() {
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    return keywordsMeta ? keywordsMeta.getAttribute('content') : '';
  }
  
  getMainContent() {
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.main-content',
      '#content',
      '#main'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanText(element.textContent);
      }
    }
    
    const bodyClone = document.body.cloneNode(true);
    const elementsToRemove = bodyClone.querySelectorAll(
      'script, style, noscript, iframe, nav, footer, header, aside, .advertisement, .ads, .social-share, .comments'
    );
    elementsToRemove.forEach(el => el.remove());
    
    return this.cleanText(bodyClone.textContent);
  }
  
  getHeadings() {
    const headings = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach(heading => {
      const text = heading.textContent.trim();
      if (text) {
        headings.push({
          level: parseInt(heading.tagName.substring(1)),
          text: text,
          id: heading.id || null
        });
      }
    });
    
    return headings;
  }
  
  getImages() {
    const images = [];
    const imageElements = document.querySelectorAll('img');
    
    imageElements.forEach(img => {
      const src = img.src;
      const alt = img.alt;
      if (src && !src.startsWith('data:')) {
        images.push({
          src: src,
          alt: alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      }
    });
    
    return images.slice(0, 10);
  }
  
  getLinks() {
    const links = [];
    const linkElements = document.querySelectorAll('a[href]');
    
    linkElements.forEach(link => {
      const href = link.href;
      const text = link.textContent.trim();
      
      if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
        links.push({
          href: href,
          text: text,
          title: link.title || ''
        });
      }
    });
    
    return links.slice(0, 20);
  }
  
  getAuthor() {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.by-author',
      '.post-author',
      '.article-author'
    ];
    
    for (const selector of authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content) {
          return content.trim();
        }
      }
    }
    
    return '';
  }
  
  getPublishDate() {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'time[datetime]',
      '.published',
      '.post-date',
      '.article-date'
    ];
    
    for (const selector of dateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dateValue = element.getAttribute('content') || 
                         element.getAttribute('datetime') || 
                         element.textContent;
        if (dateValue) {
          return dateValue.trim();
        }
      }
    }
    
    return '';
  }
  
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/\t+/g, ' ')
      .trim()
      .substring(0, 5000);
  }
  
  getPageSummary() {
    const content = this.getMainContent();
    const sentences = content.split('.').filter(s => s.length > 20);
    return sentences.slice(0, 3).join('.') + (sentences.length > 3 ? '.' : '');
  }

  playNotificationSound(soundType = 'subtle') {
    const sounds = {
      subtle: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBihxx/Hfli',
      chime: 'data:audio/wav;base64,UklGRrQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YY4DAAD//wAAAAAA//8AAAAAAP//AAAAAAD//wAAAAAA//8AAAAAAP//AAAAAAD//wAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA',
      bell: 'data:audio/wav;base64,UklGRvQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdACAABbWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa'
    };
    
    try {
      const audio = new Audio(sounds[soundType] || sounds.subtle);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if audio playback is blocked
        console.log('Audio playback blocked by browser');
      });
      
      // Add subtle visual pulse effect
      this.createVisualPulse();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  createVisualPulse() {
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.2), transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999999;
      animation: notificationPulse 0.6s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes notificationPulse {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(3);
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(pulse);
    
    setTimeout(() => {
      pulse.remove();
      style.remove();
    }, 600);
  }
}

new BookmarkContentExtractor();
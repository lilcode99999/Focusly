import React, { useState, useEffect } from 'react';
import { BOOKMARKS_STORAGE_KEY } from '@/lib/storageKeys';
import { getBookmarks, markBookmarkOpened } from '@/services/localBookmarks';
import { SmartBookmark } from '@/types/bookmark';
import './RecentItems.css';

const RecentItems: React.FC = () => {
  const [recentBookmarks, setRecentBookmarks] = useState<SmartBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBookmarks();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[BOOKMARKS_STORAGE_KEY]) {
        loadRecentBookmarks();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const loadRecentBookmarks = async () => {
    try {
      const bookmarks = await getBookmarks();
      const sorted = bookmarks
        .sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      setRecentBookmarks(sorted);
    } catch (error) {
      console.error('Failed to load recent bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookmark = async (bookmark: SmartBookmark) => {
    await markBookmarkOpened(bookmark.id);
    chrome.tabs.create({ url: bookmark.url });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  if (loading) {
    return <div className="recent-items-loading">Loading recent bookmarks...</div>;
  }

  return (
    <div className="recent-items">
      <h3 className="section-title">Recent Bookmarks</h3>
      {recentBookmarks.length === 0 ? (
        <div className="empty-state">
          <p>No bookmarks yet. Save your first one!</p>
        </div>
      ) : (
        <div className="bookmark-list">
          {recentBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bookmark-item"
              onClick={() => handleOpenBookmark(bookmark)}
            >
              <img
                src={getFaviconUrl(bookmark.url)}
                alt=""
                className="bookmark-favicon"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="bookmark-content">
                <div className="bookmark-title">{bookmark.title}</div>
                {bookmark.nextAction && (
                  <div className="bookmark-url">
                    Next: {bookmark.nextAction}
                  </div>
                )}
                <div className="bookmark-url">
                  {bookmark.sourceDomain || new URL(bookmark.url).hostname}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentItems;

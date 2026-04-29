import React, { useCallback, useState, useEffect } from 'react';
import MagicInput, { Intent } from './MagicInput';
import ContextCards, { ContextCard } from './ContextCards';
import QuickActions from './QuickActions';
import RecentItems from './RecentItems';
import { BOOKMARKS_STORAGE_KEY, DAILY_STATS_STORAGE_KEY } from '@/lib/storageKeys';
import {
  getBookmarks,
  getSourceDomain,
  markBookmarkOpened,
  markBookmarkResurfaced,
} from '@/services/localBookmarks';
import { getDailyStats } from '@/services/localStats';
import MCPService from '@/services/MCPService';
import { SmartBookmark } from '@/types/bookmark';
import './HomeTab.css';

const HomeTab: React.FC = () => {
  const [contextCards, setContextCards] = useState<ContextCard[]>([]);
  const [_isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    bookmarksToday: 0,
    focusMinutes: 0,
    tasksCompleted: 0,
  });

  const loadStats = useCallback(async () => {
    setStats(await getDailyStats());
  }, []);

  const openBookmark = useCallback(async (bookmark: SmartBookmark) => {
    await markBookmarkOpened(bookmark.id);
    chrome.tabs.create({ url: bookmark.url });
  }, []);

  const startFocusFromBookmark = useCallback(async (bookmark: SmartBookmark) => {
    await markBookmarkResurfaced(bookmark.id);
    chrome.runtime.sendMessage({
      type: 'START_FOCUS_SESSION',
      data: {
        goal: bookmark.nextAction || bookmark.whySaved || `Return to ${bookmark.title}`,
        bookmarkId: bookmark.id,
        bookmarkTitle: bookmark.title,
        sourceUrl: bookmark.url,
        sourceDomain: bookmark.sourceDomain,
      },
    });
  }, []);

  const getBookmarkContext = (bookmark: SmartBookmark) => (
    bookmark.whySaved ||
    bookmark.nextAction ||
    bookmark.note ||
    bookmark.notes ||
    bookmark.description ||
    'Saved for later context recovery.'
  );

  const loadContextCards = useCallback(async () => {
    const bookmarks = await getBookmarks();
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = currentTab?.url || '';
    const currentDomain = currentUrl ? getSourceDomain(currentUrl) : '';
    const cards: ContextCard[] = [];
    const usedBookmarkIds = new Set<string>();

    const addBookmarkCard = (
      bookmark: SmartBookmark,
      card: Omit<ContextCard, 'id'>
    ) => {
      if (usedBookmarkIds.has(bookmark.id)) {
        return;
      }

      usedBookmarkIds.add(bookmark.id);
      cards.push({
        ...card,
        id: `${card.type}-${bookmark.id}`,
      });
    };

    bookmarks
      .filter((bookmark) => currentDomain && bookmark.sourceDomain === currentDomain && bookmark.url !== currentUrl)
      .slice(0, 1)
      .forEach((bookmark) => addBookmarkCard(bookmark, {
        type: 'insight',
        title: `You saved something else from ${bookmark.sourceDomain}`,
        description: getBookmarkContext(bookmark),
        icon: '↩',
        priority: 'medium',
        action: {
          label: bookmark.nextAction ? 'Start focus' : 'Open',
          handler: () => bookmark.nextAction ? startFocusFromBookmark(bookmark) : openBookmark(bookmark),
        },
        secondaryAction: bookmark.nextAction ? {
          label: 'Open',
          handler: () => openBookmark(bookmark),
        } : undefined,
      }));

    bookmarks
      .filter((bookmark) => Boolean(bookmark.nextAction))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 2)
      .forEach((bookmark) => addBookmarkCard(bookmark, {
        type: 'task',
        title: bookmark.title,
        description: `Next: ${bookmark.nextAction}`,
        icon: '→',
        priority: 'high',
        action: {
          label: 'Start focus',
          handler: () => startFocusFromBookmark(bookmark),
        },
        secondaryAction: {
          label: 'Open',
          handler: () => openBookmark(bookmark),
        },
      }));

    bookmarks
      .filter((bookmark) => !bookmark.lastOpenedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach((bookmark) => addBookmarkCard(bookmark, {
        type: 'reminder',
        title: `Return to: ${bookmark.title}`,
        description: getBookmarkContext(bookmark),
        icon: '↺',
        priority: 'low',
        action: {
          label: bookmark.nextAction ? 'Start focus' : 'Reopen',
          handler: () => bookmark.nextAction ? startFocusFromBookmark(bookmark) : openBookmark(bookmark),
        },
        secondaryAction: bookmark.nextAction ? {
          label: 'Open',
          handler: () => openBookmark(bookmark),
        } : undefined,
      }));

    setContextCards(cards);
  }, [openBookmark, startFocusFromBookmark]);

  useEffect(() => {
    loadStats();
    loadContextCards();

    const interval = setInterval(loadContextCards, 60000);
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[DAILY_STATS_STORAGE_KEY]) {
        loadStats();
      }
      if (changes[BOOKMARKS_STORAGE_KEY]) {
        loadContextCards();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      clearInterval(interval);
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadContextCards, loadStats]);

  const handleIntentDetected = async (intent: Intent) => {
    setIsProcessing(true);

    try {
      // Process intent through MCP for AI enhancement
      const processed = await MCPService.processIntent(intent);

      // Update context cards with AI suggestions
      setContextCards(processed.suggestedActions);

      // Auto-execute if confidence is high
      if (processed.autoExecute) {
        await executeIntent(processed.intent);
      }
    } catch (error) {
      console.error('Failed to process intent:', error);

      // Show error card
      setContextCards([{
        id: 'error',
        type: 'reminder',
        title: 'Something went wrong',
        description: 'Please try again or be more specific',
        icon: '⚠️',
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIntent = async (intent: Intent) => {
    switch (intent.type) {
      case 'focus':
        // Start focus session
        chrome.runtime.sendMessage({
          type: 'START_FOCUS',
          duration: intent.parsedData.duration,
          goal: intent.parsedData.text || intent.rawInput,
        });
        break;

      case 'task':
        // Add to task list
        chrome.storage.local.get(['dailyTasks'], (result) => {
          const tasks = result.dailyTasks || [];
          tasks.push({
            id: Date.now().toString(),
            text: intent.parsedData.text,
            completed: false,
            priority: intent.parsedData.priority,
            datetime: intent.parsedData.datetime,
          });
          chrome.storage.local.set({ dailyTasks: tasks });
        });
        break;

      case 'bookmark':
        // Save bookmark
        chrome.runtime.sendMessage({
          type: 'SAVE_BOOKMARK',
          data: {
            url: intent.parsedData.url,
            title: intent.parsedData.text,
            tags: intent.parsedData.tags,
          },
        });
        break;

      case 'event':
        // Create calendar event (would integrate with calendar API)
        console.log('Creating event:', intent.parsedData);
        break;
    }

    // Show success feedback
    setContextCards(prev => [...prev, {
      id: 'success-' + Date.now(),
      type: 'task',
      title: '✓ Done!',
      description: getSuccessMessage(intent.type),
      icon: '✨',
    }]);
  };

  const getSuccessMessage = (type: string): string => {
    switch (type) {
      case 'focus': return 'Focus session started';
      case 'task': return 'Task added to your list';
      case 'bookmark': return 'Bookmark saved';
      case 'event': return 'Event scheduled';
      default: return 'Action completed';
    }
  };

  const handleCardDismiss = (cardId: string) => {
    setContextCards(prev => prev.filter(card => card.id !== cardId));
  };

  return (
    <div className="home-tab">
      <div className="home-header">
        <h2 className="home-greeting">Hi there!</h2>
        <div className="mini-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.bookmarksToday}</span>
            <span className="stat-label">saved</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.focusMinutes}</span>
            <span className="stat-label">focused</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.tasksCompleted}</span>
            <span className="stat-label">done</span>
          </div>
        </div>
      </div>

      <MagicInput onIntentDetected={handleIntentDetected} />

      <h3 className="section-title">Return to Context</h3>
      <ContextCards
        cards={contextCards}
        onDismiss={handleCardDismiss}
      />

      <QuickActions />
      <RecentItems />
    </div>
  );
};

export default HomeTab;

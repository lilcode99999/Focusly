import React, { useMemo, useState, useEffect } from 'react';
import BookmarksList from './BookmarksList';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import { BOOKMARKS_STORAGE_KEY } from '@/lib/storageKeys';
import { deleteBookmark, getBookmarks, markBookmarkResurfaced, updateBookmark } from '@/services/localBookmarks';
import { markOnboardingStep } from '@/services/localOnboarding';
import { searchBookmarks } from '@/services/bookmarkRecovery';
import { SmartBookmark } from '@/types/bookmark';
import './LibraryTab.css';

export type Bookmark = SmartBookmark;

interface LibraryTabProps {
  focusSearchSignal?: number;
  onFocusStart?: () => void;
}

const LibraryTab: React.FC<LibraryTabProps> = ({ focusSearchSignal = 0, onFocusStart }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[BOOKMARKS_STORAGE_KEY]) {
        loadBookmarks();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const searchResults = useMemo(() => (
    searchBookmarks(bookmarks, {
      query: searchQuery,
      selectedTags,
    })
  ), [bookmarks, searchQuery, selectedTags]);

  const filteredBookmarks = searchResults.bookmarks;
  const hasActiveRecoveryFilter = Boolean(searchResults.query) || selectedTags.length > 0;
  const hasMatchedSearchQuery = Boolean(searchResults.query && filteredBookmarks.length > 0);

  useEffect(() => {
    if (hasMatchedSearchQuery) {
      void markOnboardingStep('searchedLibrary');
    }
  }, [hasMatchedSearchQuery]);

  const loadBookmarks = async () => {
    try {
      setBookmarks(await getBookmarks());
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    setBookmarks(await deleteBookmark(id));
  };

  const handleEditBookmark = async (id: string, updates: Partial<Bookmark>) => {
    setBookmarks(await updateBookmark(id, updates));
  };

  const handleStartFocus = async (bookmark: Bookmark) => {
    await markBookmarkResurfaced(bookmark.id);
    await markOnboardingStep('startedFocus');
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
    onFocusStart?.();
  };

  const clearRecoveryFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(bookmarks.flatMap((b) => b.tags))
  ).sort();

  return (
    <div className="library-tab">
      <div className="library-header">
        <h2>Your Library</h2>
        <p className="library-stats">
          {bookmarks.length} bookmarks saved
        </p>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search title, URL, tags, notes, why, mood, energy, or next action..."
        focusSignal={focusSearchSignal}
      />

      {hasActiveRecoveryFilter && !loading && (
        <div className="library-results-summary" role="status">
          <span>
            {filteredBookmarks.length} {filteredBookmarks.length === 1 ? 'context' : 'contexts'} found
            {searchResults.query ? ` for "${searchResults.query}"` : ''}
            {selectedTags.length > 0 ? ` with ${selectedTags.length} ${selectedTags.length === 1 ? 'tag' : 'tags'}` : ''}
          </span>
          <button type="button" onClick={clearRecoveryFilters}>
            Clear
          </button>
        </div>
      )}

      <FilterPanel
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={(tag) => {
          setSelectedTags((prev) =>
            prev.includes(tag)
              ? prev.filter((t) => t !== tag)
              : [...prev, tag]
          );
        }}
        onClearFilters={() => setSelectedTags([])}
      />

      {loading ? (
        <div className="loading-state">Loading your bookmarks...</div>
      ) : (
        <BookmarksList
          bookmarks={filteredBookmarks}
          onDelete={handleDeleteBookmark}
          onEdit={handleEditBookmark}
          onStartFocus={handleStartFocus}
          emptyState={bookmarks.length === 0 ? {
            icon: 'book',
            title: 'No saved contexts yet',
            description: 'Save a page with why it matters and the next step. Future you gets a clean place to restart.',
          } : hasActiveRecoveryFilter ? {
            icon: 'search',
            title: 'No matching context yet',
            description: 'Try a next action, why you saved it, a tag, mood, energy level, or domain.',
            actionLabel: 'Clear search',
            onAction: clearRecoveryFilters,
          } : undefined}
        />
      )}
    </div>
  );
};

export default LibraryTab;

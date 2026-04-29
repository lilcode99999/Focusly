import React, { useState, useEffect } from 'react';
import BookmarksList from './BookmarksList';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import { BOOKMARKS_STORAGE_KEY } from '@/lib/storageKeys';
import { deleteBookmark, getBookmarks, markBookmarkResurfaced, updateBookmark } from '@/services/localBookmarks';
import { markOnboardingStep } from '@/services/localOnboarding';
import { SmartBookmark } from '@/types/bookmark';
import './LibraryTab.css';

export type Bookmark = SmartBookmark;

const LibraryTab: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
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

  useEffect(() => {
    filterBookmarks();
  }, [bookmarks, searchQuery, selectedTags]);

  useEffect(() => {
    if (searchQuery.trim()) {
      void markOnboardingStep('searchedLibrary');
    }
  }, [searchQuery]);

  const loadBookmarks = async () => {
    try {
      setBookmarks(await getBookmarks());
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookmarks = () => {
    let filtered = [...bookmarks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = (bookmark: Bookmark) => [
        bookmark.title,
        bookmark.url,
        bookmark.description,
        bookmark.note,
        bookmark.notes,
        bookmark.whySaved,
        bookmark.mood,
        bookmark.energy,
        bookmark.nextAction,
        bookmark.sourceTabTitle,
        bookmark.sourceDomain,
        ...bookmark.tags,
      ].filter(Boolean).join(' ').toLowerCase();

      filtered = filtered.filter(
        (bookmark) => searchableText(bookmark).includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((bookmark) =>
        selectedTags.every((tag) => bookmark.tags.includes(tag))
      );
    }

    // Sort by most recent
    filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredBookmarks(filtered);
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
      />

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
        />
      )}
    </div>
  );
};

export default LibraryTab;

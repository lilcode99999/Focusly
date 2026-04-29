import { BOOKMARKS_STORAGE_KEY } from '@/lib/storageKeys';
import { BookmarkInput, SaveBookmarkResult, SmartBookmark } from '@/types/bookmark';
import { incrementDailyStats } from './localStats';

const normalizeTags = (tags?: string[]): string[] => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

export const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

export const normalizeBookmark = (bookmark: Partial<SmartBookmark>): SmartBookmark => {
  const now = new Date().toISOString();
  const url = bookmark.url || '';
  const note = bookmark.note ?? bookmark.notes ?? '';

  return {
    id: bookmark.id || Date.now().toString(),
    title: bookmark.title || url || 'Untitled bookmark',
    url,
    description: bookmark.description || '',
    tags: normalizeTags(bookmark.tags),
    createdAt: bookmark.createdAt || now,
    updatedAt: bookmark.updatedAt || now,
    favicon: bookmark.favicon,
    note,
    notes: note,
    whySaved: bookmark.whySaved || '',
    mood: bookmark.mood || '',
    energy: bookmark.energy,
    nextAction: bookmark.nextAction || '',
    lastOpenedAt: bookmark.lastOpenedAt,
    lastResurfacedAt: bookmark.lastResurfacedAt,
    sourceTabTitle: bookmark.sourceTabTitle || bookmark.title || '',
    sourceDomain: bookmark.sourceDomain || getSourceDomain(url),
  };
};

export const getBookmarks = async (): Promise<SmartBookmark[]> => {
  const result = await chrome.storage.local.get([BOOKMARKS_STORAGE_KEY]);
  const storedBookmarks = result[BOOKMARKS_STORAGE_KEY];

  if (!Array.isArray(storedBookmarks)) {
    return [];
  }

  return storedBookmarks.map((bookmark) => normalizeBookmark(bookmark));
};

export const saveBookmarks = async (bookmarks: SmartBookmark[]): Promise<void> => {
  await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: bookmarks });
};

export const saveBookmark = async (input: BookmarkInput): Promise<SaveBookmarkResult> => {
  const bookmarks = await getBookmarks();
  const now = new Date().toISOString();
  const existingIndex = bookmarks.findIndex((bookmark) => bookmark.url === input.url);
  const sourceDomain = getSourceDomain(input.url);

  if (existingIndex >= 0) {
    const existing = bookmarks[existingIndex];
    const bookmark = normalizeBookmark({
      ...existing,
      ...input,
      tags: input.tags?.length ? input.tags : existing.tags,
      note: input.note ?? existing.note,
      notes: input.note ?? existing.note,
      whySaved: input.whySaved ?? existing.whySaved,
      mood: input.mood ?? existing.mood,
      energy: input.energy ?? existing.energy,
      nextAction: input.nextAction ?? existing.nextAction,
      sourceDomain,
      sourceTabTitle: input.sourceTabTitle || existing.sourceTabTitle || input.title,
      updatedAt: now,
    });

    const updatedBookmarks = [...bookmarks];
    updatedBookmarks[existingIndex] = bookmark;
    await saveBookmarks(updatedBookmarks);

    return { bookmark, created: false };
  }

  const bookmark = normalizeBookmark({
    ...input,
    id: now,
    tags: input.tags,
    sourceDomain,
    sourceTabTitle: input.sourceTabTitle || input.title,
    createdAt: now,
    updatedAt: now,
  });

  await saveBookmarks([bookmark, ...bookmarks]);
  await incrementDailyStats({ bookmarksToday: 1 });

  return { bookmark, created: true };
};

export const updateBookmark = async (
  id: string,
  updates: Partial<SmartBookmark>
): Promise<SmartBookmark[]> => {
  const bookmarks = await getBookmarks();
  const updatedBookmarks = bookmarks.map((bookmark) =>
    bookmark.id === id
      ? normalizeBookmark({
          ...bookmark,
          ...updates,
          tags: updates.tags || bookmark.tags,
          updatedAt: new Date().toISOString(),
        })
      : bookmark
  );

  await saveBookmarks(updatedBookmarks);
  return updatedBookmarks;
};

export const deleteBookmark = async (id: string): Promise<SmartBookmark[]> => {
  const bookmarks = await getBookmarks();
  const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
  await saveBookmarks(updatedBookmarks);
  return updatedBookmarks;
};

export const markBookmarkOpened = async (id: string): Promise<SmartBookmark[]> => {
  return updateBookmark(id, { lastOpenedAt: new Date().toISOString() });
};

export const markBookmarkResurfaced = async (id: string): Promise<SmartBookmark[]> => {
  return updateBookmark(id, { lastResurfacedAt: new Date().toISOString() });
};

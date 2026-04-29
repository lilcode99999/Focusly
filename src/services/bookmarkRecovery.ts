import { SmartBookmark } from '@/types/bookmark';

type SearchFieldName =
  | 'nextAction'
  | 'whySaved'
  | 'title'
  | 'tags'
  | 'notes'
  | 'description'
  | 'domain'
  | 'url'
  | 'mood'
  | 'energy';

interface WeightedSearchField {
  name: SearchFieldName;
  text: string;
  weight: number;
}

export interface BookmarkSearchOptions {
  query?: string;
  selectedTags?: string[];
}

export interface RankedBookmark {
  bookmark: SmartBookmark;
  score: number;
  matchedFields: SearchFieldName[];
}

export interface BookmarkSearchResult {
  bookmarks: SmartBookmark[];
  rankedBookmarks: RankedBookmark[];
  query: string;
  selectedTags: string[];
}

export interface RecoveryCandidate {
  bookmark: SmartBookmark;
  score: number;
  reason: string;
}

const FIELD_WEIGHTS: Record<SearchFieldName, number> = {
  nextAction: 42,
  whySaved: 36,
  title: 30,
  tags: 24,
  notes: 14,
  description: 12,
  domain: 10,
  url: 8,
  mood: 8,
  energy: 8,
};

const normalizeSearchText = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const tokenizeQuery = (query: string): string[] =>
  normalizeSearchText(query)
    .split(/\s+/)
    .filter(Boolean);

const getUrlDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const getFreshnessTime = (bookmark: SmartBookmark): number => {
  const updatedAt = new Date(bookmark.updatedAt || bookmark.createdAt).getTime();
  const createdAt = new Date(bookmark.createdAt).getTime();
  return Math.max(
    Number.isNaN(updatedAt) ? 0 : updatedAt,
    Number.isNaN(createdAt) ? 0 : createdAt
  );
};

const getSearchFields = (bookmark: SmartBookmark): WeightedSearchField[] => [
  {
    name: 'nextAction',
    text: bookmark.nextAction || '',
    weight: FIELD_WEIGHTS.nextAction,
  },
  {
    name: 'whySaved',
    text: bookmark.whySaved || '',
    weight: FIELD_WEIGHTS.whySaved,
  },
  {
    name: 'title',
    text: bookmark.title,
    weight: FIELD_WEIGHTS.title,
  },
  {
    name: 'tags',
    text: bookmark.tags.join(' '),
    weight: FIELD_WEIGHTS.tags,
  },
  {
    name: 'notes',
    text: [bookmark.note, bookmark.notes].filter(Boolean).join(' '),
    weight: FIELD_WEIGHTS.notes,
  },
  {
    name: 'description',
    text: bookmark.description || '',
    weight: FIELD_WEIGHTS.description,
  },
  {
    name: 'domain',
    text: [bookmark.sourceDomain, getUrlDomain(bookmark.url)].filter(Boolean).join(' '),
    weight: FIELD_WEIGHTS.domain,
  },
  {
    name: 'url',
    text: bookmark.url,
    weight: FIELD_WEIGHTS.url,
  },
  {
    name: 'mood',
    text: bookmark.mood || '',
    weight: FIELD_WEIGHTS.mood,
  },
  {
    name: 'energy',
    text: bookmark.energy || '',
    weight: FIELD_WEIGHTS.energy,
  },
];

const matchesSelectedTags = (bookmark: SmartBookmark, selectedTags: string[]): boolean => {
  if (selectedTags.length === 0) {
    return true;
  }

  const bookmarkTags = new Set(bookmark.tags.map(normalizeSearchText));
  return selectedTags.every((tag) => bookmarkTags.has(normalizeSearchText(tag)));
};

const scoreBookmarkForQuery = (
  bookmark: SmartBookmark,
  query: string,
  queryTokens: string[]
): RankedBookmark | null => {
  if (queryTokens.length === 0) {
    return {
      bookmark,
      score: getFreshnessTime(bookmark),
      matchedFields: [],
    };
  }

  const normalizedQuery = normalizeSearchText(query);
  const fields = getSearchFields(bookmark).map((field) => ({
    ...field,
    text: normalizeSearchText(field.text),
  }));
  const combinedText = fields.map((field) => field.text).join(' ');

  if (!queryTokens.every((token) => combinedText.includes(token))) {
    return null;
  }

  let score = 0;
  const matchedFields = new Set<SearchFieldName>();

  for (const field of fields) {
    if (!field.text) {
      continue;
    }

    let fieldMatched = false;
    if (field.text.includes(normalizedQuery)) {
      score += field.weight * 2;
      fieldMatched = true;
    }

    for (const token of queryTokens) {
      if (field.text.includes(token)) {
        score += field.weight / queryTokens.length;
        fieldMatched = true;
      }
    }

    if (fieldMatched) {
      matchedFields.add(field.name);
    }
  }

  const normalizedTags = new Set(bookmark.tags.map(normalizeSearchText));
  if (queryTokens.some((token) => normalizedTags.has(token))) {
    score += FIELD_WEIGHTS.tags;
    matchedFields.add('tags');
  }

  score += getFreshnessTime(bookmark) / 1000000000000;

  return {
    bookmark,
    score,
    matchedFields: Array.from(matchedFields),
  };
};

export const searchBookmarks = (
  bookmarks: SmartBookmark[],
  options: BookmarkSearchOptions = {}
): BookmarkSearchResult => {
  const query = options.query?.trim() || '';
  const selectedTags = (options.selectedTags || []).filter(Boolean);
  const queryTokens = tokenizeQuery(query);
  const tagFilteredBookmarks = bookmarks.filter((bookmark) =>
    matchesSelectedTags(bookmark, selectedTags)
  );

  if (queryTokens.length === 0) {
    const rankedBookmarks = tagFilteredBookmarks
      .map((bookmark): RankedBookmark => ({
        bookmark,
        score: getFreshnessTime(bookmark),
        matchedFields: [],
      }))
      .sort((a, b) => b.score - a.score);

    return {
      bookmarks: rankedBookmarks.map((result) => result.bookmark),
      rankedBookmarks,
      query,
      selectedTags,
    };
  }

  const rankedBookmarks = tagFilteredBookmarks
    .map((bookmark) => scoreBookmarkForQuery(bookmark, query, queryTokens))
    .filter((result): result is RankedBookmark => Boolean(result))
    .sort((a, b) => b.score - a.score);

  return {
    bookmarks: rankedBookmarks.map((result) => result.bookmark),
    rankedBookmarks,
    query,
    selectedTags,
  };
};

const getRecoveryReason = (bookmark: SmartBookmark): string => {
  if (bookmark.nextAction?.trim()) {
    return 'Has a next action';
  }

  if (!bookmark.lastOpenedAt) {
    return 'Saved and not opened yet';
  }

  if (bookmark.whySaved?.trim()) {
    return 'Has saved context';
  }

  return 'Recently saved';
};

export const getRecoveryCandidates = (
  bookmarks: SmartBookmark[],
  limit = 3
): RecoveryCandidate[] =>
  bookmarks
    .map((bookmark) => {
      const hasNextAction = Boolean(bookmark.nextAction?.trim());
      const hasWhySaved = Boolean(bookmark.whySaved?.trim());
      const notOpenedYet = !bookmark.lastOpenedAt;
      const freshnessScore = getFreshnessTime(bookmark) / 1000000000000;

      return {
        bookmark,
        score:
          (hasNextAction ? 10000 : 0) +
          (notOpenedYet ? 1000 : 0) +
          (hasWhySaved ? 100 : 0) +
          freshnessScore,
        reason: getRecoveryReason(bookmark),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

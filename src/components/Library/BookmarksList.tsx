import React, { useState } from 'react';
import { Bookmark } from './LibraryTab';
import BookmarkItem from './BookmarkItem';
import './BookmarksList.css';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Bookmark>) => void;
  onStartFocus: (bookmark: Bookmark) => void;
  emptyState?: {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  onDelete,
  onEdit,
  onStartFocus,
  emptyState,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div className="empty-bookmarks">
        <div className="empty-icon">{emptyState?.icon || '📚'}</div>
        <h3>{emptyState?.title || 'No bookmarks found'}</h3>
        <p>{emptyState?.description || 'Save your first bookmark to get started.'}</p>
        {emptyState?.actionLabel && emptyState.onAction && (
          <button className="empty-action" onClick={emptyState.onAction}>
            {emptyState.actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bookmarks-list">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          isEditing={editingId === bookmark.id}
          onEdit={(updates) => {
            onEdit(bookmark.id, updates);
            setEditingId(null);
          }}
          onEditStart={() => setEditingId(bookmark.id)}
          onEditCancel={() => setEditingId(null)}
          onDelete={() => onDelete(bookmark.id)}
          onStartFocus={() => onStartFocus(bookmark)}
        />
      ))}
    </div>
  );
};

export default BookmarksList;

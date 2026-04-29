import React, { useState } from 'react';
import { Bookmark } from './LibraryTab';
import BookmarkItem from './BookmarkItem';
import './BookmarksList.css';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Bookmark>) => void;
  onStartFocus: (bookmark: Bookmark) => void;
}

const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  onDelete,
  onEdit,
  onStartFocus,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div className="empty-bookmarks">
        <div className="empty-icon">📚</div>
        <h3>No bookmarks found</h3>
        <p>Save your first bookmark to get started!</p>
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

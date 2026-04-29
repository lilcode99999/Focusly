import React, { useState } from 'react';
import { Bookmark } from './LibraryTab';
import { markBookmarkOpened } from '@/services/localBookmarks';
import { EnergyLevel } from '@/types/bookmark';
import './BookmarkItem.css';

interface BookmarkItemProps {
  bookmark: Bookmark;
  isEditing: boolean;
  onEdit: (updates: Partial<Bookmark>) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onStartFocus: () => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  isEditing,
  onEdit,
  onEditStart,
  onEditCancel,
  onDelete,
  onStartFocus,
}) => {
  const [editForm, setEditForm] = useState({
    title: bookmark.title,
    description: bookmark.description || '',
    tags: bookmark.tags.join(', '),
    note: bookmark.note || bookmark.notes || '',
    whySaved: bookmark.whySaved || '',
    nextAction: bookmark.nextAction || '',
    mood: bookmark.mood || '',
    energy: (bookmark.energy || '') as '' | EnergyLevel,
  });

  const handleSave = () => {
    onEdit({
      title: editForm.title,
      description: editForm.description,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      note: editForm.note,
      notes: editForm.note,
      whySaved: editForm.whySaved,
      nextAction: editForm.nextAction,
      mood: editForm.mood,
      energy: editForm.energy || undefined,
    });
  };

  const handleOpenBookmark = async () => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isEditing) {
    return (
      <div className="bookmark-item editing">
        <input
          type="text"
          className="edit-input"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          placeholder="Title"
        />
        <textarea
          className="edit-textarea"
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
        />
        <input
          type="text"
          className="edit-input"
          value={editForm.tags}
          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
          placeholder="Tags (comma separated)"
        />
        <textarea
          className="edit-textarea"
          value={editForm.whySaved}
          onChange={(e) => setEditForm({ ...editForm, whySaved: e.target.value })}
          placeholder="Why I saved this"
          rows={2}
        />
        <input
          type="text"
          className="edit-input"
          value={editForm.nextAction}
          onChange={(e) => setEditForm({ ...editForm, nextAction: e.target.value })}
          placeholder="Next action"
        />
        <textarea
          className="edit-textarea"
          value={editForm.note}
          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
          placeholder="Notes (optional)"
          rows={3}
        />
        <div className="edit-context-row">
          <input
            type="text"
            className="edit-input"
            value={editForm.mood}
            onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })}
            placeholder="Mood"
          />
          <select
            className="edit-input"
            value={editForm.energy}
            onChange={(e) => setEditForm({ ...editForm, energy: e.target.value as '' | EnergyLevel })}
          >
            <option value="">Any energy</option>
            <option value="low">Low energy</option>
            <option value="medium">Medium energy</option>
            <option value="high">High energy</option>
          </select>
        </div>
        <div className="edit-actions">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-button" onClick={onEditCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmark-item">
      <div className="bookmark-main" onClick={handleOpenBookmark}>
        <img
          src={getFaviconUrl(bookmark.url)}
          alt=""
          className="bookmark-favicon"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="bookmark-content">
          <h4 className="bookmark-title">{bookmark.title}</h4>
          {bookmark.description && (
            <p className="bookmark-description">{bookmark.description}</p>
          )}
          {bookmark.whySaved && (
            <p className="bookmark-context">
              <span>Why:</span> {bookmark.whySaved}
            </p>
          )}
          {bookmark.nextAction && (
            <p className="bookmark-next-action">
              <span>Next:</span> {bookmark.nextAction}
            </p>
          )}
          {(bookmark.note || bookmark.notes) && (
            <p className="bookmark-description">{bookmark.note || bookmark.notes}</p>
          )}
          <div className="bookmark-meta">
            <span className="bookmark-url">{bookmark.sourceDomain || new URL(bookmark.url).hostname}</span>
            <span className="bookmark-date">{formatDate(bookmark.createdAt)}</span>
            {bookmark.mood && <span>{bookmark.mood}</span>}
            {bookmark.energy && <span>{bookmark.energy} energy</span>}
          </div>
          {bookmark.tags.length > 0 && (
            <div className="bookmark-tags">
              {bookmark.tags.map((tag) => (
                <span key={tag} className="bookmark-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bookmark-actions">
        <button
          className="action-button"
          onClick={onStartFocus}
          aria-label="Start focus session for bookmark"
        >
          ⏱️
        </button>
        <button
          className="action-button"
          onClick={onEditStart}
          aria-label="Edit bookmark"
        >
          ✏️
        </button>
        <button
          className="action-button delete"
          onClick={onDelete}
          aria-label="Delete bookmark"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default BookmarkItem;

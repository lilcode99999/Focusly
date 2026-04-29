import React, { useState } from 'react';
import { Note, CalendarEvent } from './NotesTab';

interface NotesTimelineProps {
  notes: Note[];
  onNoteEdit: (note: Note) => Promise<void>;
  onNoteDelete: (noteId: string) => Promise<void>;
  onCreateEvent: (event: CalendarEvent) => Promise<void>;
}

const NotesTimeline: React.FC<NotesTimelineProps> = ({
  notes,
  onNoteEdit,
  onNoteDelete,
  onCreateEvent
}) => {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const groupNotesByDate = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};

    notes.forEach(note => {
      const date = new Date(note.timestamp);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(note);
    });

    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, notes]) => ({
        date,
        notes: notes.sort((a, b) => b.timestamp - a.timestamp)
      }));
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const getMoodEmoji = (mood?: Note['mood']): string => {
    switch (mood) {
      case 'energized': return '⚡';
      case 'focused': return '🎯';
      case 'scattered': return '🌪️';
      case 'reflective': return '🤔';
      default: return '💭';
    }
  };

  const getUrgencyColor = (urgency?: Note['urgency']): string => {
    switch (urgency) {
      case 'now': return 'var(--error-color)';
      case 'today': return 'var(--warning-color)';
      case 'week': return 'var(--accent-color)';
      case 'someday': return 'var(--text-tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const saveEdit = async (note: Note) => {
    try {
      const updatedNote: Note = {
        ...note,
        content: editContent,
        lastEdited: Date.now(),
        title: editContent.split('\n')[0].substring(0, 50) || note.title
      };

      await onNoteEdit(updatedNote);
      setEditingNote(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to save note edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const createEventFromNote = async (note: Note) => {
    const event: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Review: ${note.title}`,
      date: new Date(Date.now() + 86400000), // Tomorrow
      duration: 30, // 30 minutes
      type: 'note-session',
      linkedNoteId: note.id,
      energyLevel: note.energy || 'medium'
    };

    await onCreateEvent(event);
  };

  const groupedNotes = groupNotesByDate(notes);

  if (notes.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h3>No notes yet</h3>
          <p>Start capturing your thoughts with the quick capture above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-timeline">
      {groupedNotes.map(({ date, notes }) => (
        <div key={date} className="timeline-group">
          <div className="timeline-date">
            <h3>{date}</h3>
            <span className="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="timeline-notes">
            {notes.map(note => (
              <div key={note.id} className={`timeline-note ${note.pinned ? 'pinned' : ''}`}>
                <div className="note-header">
                  <div className="note-meta">
                    <span className="note-mood">{getMoodEmoji(note.mood)}</span>
                    <span className="note-title">{note.title}</span>
                    {note.urgency && (
                      <span
                        className="note-urgency"
                        style={{ color: getUrgencyColor(note.urgency) }}
                      >
                        {note.urgency}
                      </span>
                    )}
                  </div>

                  <div className="note-actions">
                    <button
                      className="action-button"
                      onClick={() => createEventFromNote(note)}
                      title="Schedule review"
                    >
                      📅
                    </button>
                    <button
                      className="action-button"
                      onClick={() => startEditing(note)}
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-button delete-button"
                      onClick={() => onNoteDelete(note.id)}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="note-content">
                  {editingNote === note.id ? (
                    <div className="edit-mode">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="edit-textarea"
                        rows={4}
                      />
                      <div className="edit-actions">
                        <button
                          className="save-edit-button"
                          onClick={() => saveEdit(note)}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-edit-button"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-text">
                      {note.content.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>

                {note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span key={tag} className="note-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-footer">
                  <span className="note-time">{formatRelativeTime(note.timestamp)}</span>
                  <span className="note-stats">
                    {note.metadata.wordCount} words
                    {note.metadata.actionItems.length > 0 && (
                      <span className="action-items-count">
                        • {note.metadata.actionItems.length} action{note.metadata.actionItems.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesTimeline;
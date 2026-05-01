import React, { useState } from 'react';
import AppIcon, { AppIconName } from '@/components/common/AppIcon';
import { Note } from './NotesTab';

interface SearchInterfaceProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  filteredNotes: Note[];
  onNoteEdit: (note: Note) => Promise<void>;
  onNoteDelete: (noteId: string) => Promise<void>;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  availableTags,
  filteredNotes,
  onNoteEdit,
  onNoteDelete
}) => {
  const [sortBy, setSortBy] = useState<'timestamp' | 'lastEdited' | 'wordCount' | 'title'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMood, setFilterMood] = useState<Note['mood'] | 'all'>('all');
  const [filterUrgency, setFilterUrgency] = useState<Note['urgency'] | 'all'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onTagsChange([]);
    setFilterMood('all');
    setFilterUrgency('all');
  };

  const sortedNotes = [...filteredNotes]
    .filter(note => {
      if (filterMood !== 'all' && note.mood !== filterMood) return false;
      if (filterUrgency !== 'all' && note.urgency !== filterUrgency) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'lastEdited':
          comparison = a.lastEdited - b.lastEdited;
          break;
        case 'wordCount':
          comparison = a.metadata.wordCount - b.metadata.wordCount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  const getMoodIcon = (mood?: Note['mood']): AppIconName => {
    switch (mood) {
      case 'energized': return 'zap';
      case 'focused': return 'target';
      case 'scattered': return 'wind';
      case 'reflective': return 'lightbulb';
      default: return 'message';
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

  return (
    <div className="search-interface">
      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search notes by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="clear-search-button"
            onClick={() => onSearchChange('')}
            disabled={!searchQuery}
            aria-label="Clear search"
          >
            <AppIcon name="x" size={14} />
          </button>
        </div>

        <div className="filter-controls">
          <button
            className="toggle-filters-button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <AppIcon className="button-icon" name="sliders" size={14} />
            <span>{showAdvancedFilters ? 'Hide' : 'Show'} Filters</span>
          </button>

          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="sort-select"
            >
              <option value="timestamp">Created Date</option>
              <option value="lastEdited">Last Edited</option>
              <option value="wordCount">Word Count</option>
              <option value="title">Title</option>
            </select>

            <button
              className="sort-order-button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Mood:</label>
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value as typeof filterMood)}
              className="filter-select"
            >
              <option value="all">All Moods</option>
              <option value="energized">Energized</option>
              <option value="focused">Focused</option>
              <option value="scattered">Scattered</option>
              <option value="reflective">Reflective</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Urgency:</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value as typeof filterUrgency)}
              className="filter-select"
            >
              <option value="all">All Urgency</option>
              <option value="now">Now</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="someday">Someday</option>
            </select>
          </div>

          <button
            className="clear-filters-button"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {availableTags.length > 0 && (
        <div className="tag-filters">
          <span className="filter-label">Filter by tags:</span>
          <div className="tag-list">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="search-results">
        <div className="results-header">
          <span className="results-count">
            {sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="no-results">
            <AppIcon className="no-results-icon" name="search" size={48} />
            <p>No notes match your search criteria</p>
            <button onClick={clearAllFilters} className="clear-filters-suggestion">
              Clear filters to see all notes
            </button>
          </div>
        ) : (
          <div className="results-list">
            {sortedNotes.map(note => (
              <div key={note.id} className="search-result-note">
                <div className="note-header">
                  <div className="note-meta">
                    <AppIcon className="note-mood" name={getMoodIcon(note.mood)} size={16} />
                    <span className="note-title">
                      {highlightSearchTerm(note.title, searchQuery)}
                    </span>
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
                      className="action-button delete-button"
                      onClick={() => onNoteDelete(note.id)}
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <AppIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="note-content-preview">
                  {highlightSearchTerm(
                    note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''),
                    searchQuery
                  )}
                </div>

                {note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span
                        key={tag}
                        className={`note-tag ${selectedTags.includes(tag) ? 'highlighted' : ''}`}
                      >
                        #{highlightSearchTerm(tag, searchQuery)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-footer">
                  <span className="note-date">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                  <span className="note-stats">
                    {note.metadata.wordCount} words
                    {note.metadata.actionItems.length > 0 && (
                      <span> • {note.metadata.actionItems.length} action{note.metadata.actionItems.length !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;

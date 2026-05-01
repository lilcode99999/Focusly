import React, { useState, useEffect } from 'react';
import AppIcon from '@/components/common/AppIcon';
import QuickCapture from './QuickCapture';
import NotesTimeline from './NotesTimeline';
import CalendarView from './CalendarView';
import SearchInterface from './SearchInterface';
import './NotesTab.css';

export interface Note {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  type: 'quick' | 'full' | 'template';
  category: string;
  tags: string[];
  timestamp: number;
  lastEdited: number;
  pinned: boolean;
  mood?: 'energized' | 'focused' | 'scattered' | 'reflective';
  urgency?: 'now' | 'today' | 'week' | 'someday';
  energy?: 'high' | 'medium' | 'low';
  linkedEvents?: string[];
  metadata: {
    wordCount: number;
    hasHashtags: boolean;
    hasTasks: boolean;
    sentiment?: string;
    topics: string[];
    actionItems: string[];
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  duration: number;
  type: 'event' | 'reminder' | 'note-session';
  linkedNoteId?: string;
  energyLevel?: 'high' | 'medium' | 'low';
}

const NotesTab: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'timeline' | 'calendar' | 'search'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
    loadEvents();
  }, []);

  const loadNotes = async () => {
    try {
      const result = await chrome.storage.local.get(['notes']);
      if (result.notes) {
        setNotes(result.notes);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const result = await chrome.storage.local.get(['calendarEvents']);
      if (result.calendarEvents) {
        setEvents(result.calendarEvents.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        })));
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const saveNote = async (note: Note) => {
    try {
      const sanitizedNote: Note = {
        ...note,
        content: sanitizeContent(note.content),
        htmlContent: note.htmlContent ? sanitizeContent(note.htmlContent) : undefined
      };

      const updatedNotes = notes.some(n => n.id === note.id)
        ? notes.map(n => n.id === note.id ? sanitizedNote : n)
        : [...notes, sanitizedNote];

      setNotes(updatedNotes);
      await chrome.storage.local.set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to save note:', error);
      throw new Error('Failed to save note');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      await chrome.storage.local.set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const saveEvent = async (event: CalendarEvent) => {
    try {
      const updatedEvents = events.some(e => e.id === event.id)
        ? events.map(e => e.id === event.id ? event : e)
        : [...events, event];

      setEvents(updatedEvents);
      await chrome.storage.local.set({
        calendarEvents: updatedEvents.map(e => ({
          ...e,
          date: e.date.toISOString()
        }))
      });
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const sanitizeContent = (content: string): string => {
    // Remove potentially dangerous HTML/JS
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => note.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  return (
    <div className="notes-tab">
      <div className="notes-header">
        <h2>Notes & Calendar</h2>
        <div className="view-controls">
          <button
            className={`view-button ${view === 'timeline' ? 'active' : ''}`}
            onClick={() => setView('timeline')}
          >
            <AppIcon className="view-icon" name="file" size={15} />
            <span>Timeline</span>
          </button>
          <button
            className={`view-button ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            <AppIcon className="view-icon" name="calendar" size={15} />
            <span>Calendar</span>
          </button>
          <button
            className={`view-button ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView('search')}
          >
            <AppIcon className="view-icon" name="search" size={15} />
            <span>Search</span>
          </button>
        </div>
      </div>

      <QuickCapture onSave={saveNote} />

      {view === 'search' && (
        <SearchInterface
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          availableTags={allTags}
          filteredNotes={filteredNotes}
          onNoteEdit={saveNote}
          onNoteDelete={deleteNote}
        />
      )}

      {view === 'timeline' && (
        <NotesTimeline
          notes={filteredNotes}
          onNoteEdit={saveNote}
          onNoteDelete={deleteNote}
          onCreateEvent={saveEvent}
        />
      )}

      {view === 'calendar' && (
        <CalendarView
          events={events}
          notes={notes}
          onEventEdit={saveEvent}
          onNoteCreate={saveNote}
          onEventCreate={saveEvent}
        />
      )}
    </div>
  );
};

export default NotesTab;

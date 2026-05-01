import React, { useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { Note, CalendarEvent } from './NotesTab';

interface CalendarViewProps {
  events: CalendarEvent[];
  notes: Note[];
  onEventEdit: (event: CalendarEvent) => Promise<void>;
  onNoteCreate: (note: Note) => Promise<void>;
  onEventCreate: (event: CalendarEvent) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  notes,
  onEventEdit,
  onNoteCreate,
  onEventCreate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDuration, setNewEventDuration] = useState(30);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      event.date.toDateString() === date.toDateString()
    );
  };

  const getNotesForDate = (date: Date) => {
    return notes.filter(note =>
      new Date(note.timestamp).toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const createEvent = async () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    const event: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newEventTitle,
      date: selectedDate,
      duration: newEventDuration,
      type: 'event',
      energyLevel: 'medium'
    };

    await onEventCreate(event);
    setShowEventForm(false);
    setNewEventTitle('');
    setNewEventDuration(30);
  };

  const createNoteForDate = async (date: Date) => {
    const note: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Note for ${date.toLocaleDateString()}`,
      content: '',
      type: 'full',
      category: 'general',
      tags: [],
      timestamp: date.getTime(),
      lastEdited: Date.now(),
      pinned: false,
      metadata: {
        wordCount: 0,
        hasHashtags: false,
        hasTasks: false,
        topics: [],
        actionItems: []
      }
    };

    await onNoteCreate(note);
  };

  const getEnergyColor = (energyLevel?: CalendarEvent['energyLevel']) => {
    switch (energyLevel) {
      case 'high': return 'var(--success-color)';
      case 'medium': return 'var(--accent-color)';
      case 'low': return 'var(--warning-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="nav-button"
          onClick={() => navigateMonth('prev')}
          aria-label="Previous month"
        >
          <AppIcon name="chevron-right" size={16} className="nav-icon previous" />
        </button>
        <h3 className="month-year">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          className="nav-button"
          onClick={() => navigateMonth('next')}
          aria-label="Next month"
        >
          <AppIcon name="chevron-right" size={16} />
        </button>
      </div>

      <div className="calendar-grid">
        <div className="day-headers">
          {dayNames.map(day => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="calendar-day empty" />;
            }

            const dayEvents = getEventsForDate(date);
            const dayNotes = getNotesForDate(date);
            const hasActivity = dayEvents.length > 0 || dayNotes.length > 0;

            return (
              <div
                key={date.toISOString()}
                className={`calendar-day ${isToday(date) ? 'today' : ''} ${hasActivity ? 'has-activity' : ''} ${selectedDate?.toDateString() === date.toDateString() ? 'selected' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                <div className="day-number">{date.getDate()}</div>

                {hasActivity && (
                  <div className="day-indicators">
                    {dayEvents.length > 0 && (
                      <span className="event-indicator">
                        <AppIcon name="calendar" size={10} />
                        {dayEvents.length}
                      </span>
                    )}
                    {dayNotes.length > 0 && (
                      <span className="note-indicator">
                        <AppIcon name="file" size={10} />
                        {dayNotes.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="day-details">
          <div className="day-details-header">
            <h4>{selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</h4>
            <div className="day-actions">
              <button
                className="action-button"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                <AppIcon className="button-icon" name="calendar" size={14} />
                <span>Add Event</span>
              </button>
              <button
                className="action-button"
                onClick={() => createNoteForDate(selectedDate)}
              >
                <AppIcon className="button-icon" name="file" size={14} />
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {showEventForm && (
            <div className="event-form">
              <input
                type="text"
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="event-title-input"
              />
              <div className="duration-control">
                <label>Duration:</label>
                <select
                  value={newEventDuration}
                  onChange={(e) => setNewEventDuration(Number(e.target.value))}
                  className="duration-select"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className="form-actions">
                <button onClick={createEvent} className="create-event-button">
                  Create Event
                </button>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="day-content">
            {getEventsForDate(selectedDate).map(event => (
              <div key={event.id} className="day-event">
                <span
                  className="event-dot"
                  style={{ backgroundColor: getEnergyColor(event.energyLevel) }}
                />
                <div className="event-details">
                  <span className="event-title">{event.title}</span>
                  <span className="event-duration">{event.duration} min</span>
                </div>
              </div>
            ))}

            {getNotesForDate(selectedDate).map(note => (
              <div key={note.id} className="day-note">
                <AppIcon className="note-icon" name="file" size={18} />
                <div className="note-preview">
                  <span className="note-title">{note.title}</span>
                  <span className="note-preview-text">
                    {note.content.substring(0, 100)}
                    {note.content.length > 100 ? '...' : ''}
                  </span>
                </div>
              </div>
            ))}

            {getEventsForDate(selectedDate).length === 0 && getNotesForDate(selectedDate).length === 0 && (
              <div className="no-activity">
                <p>No events or notes for this day</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

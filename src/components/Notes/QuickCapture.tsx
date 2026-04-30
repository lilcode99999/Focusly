import React, { useState, useRef } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { Note } from './NotesTab';

interface QuickCaptureProps {
  onSave: (note: Note) => Promise<void>;
}

const QuickCapture: React.FC<QuickCaptureProps> = ({ onSave }) => {
  const [content, setContent] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateNote = (): Note => {
    const timestamp = Date.now();
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const hasHashtags = content.includes('#');
    const hasTasks = /^[-\*\d]+\./gm.test(content);

    // Extract hashtags as tags
    const hashtags = (content.match(/#[\w]+/g) || []).map(tag => tag.substring(1));

    // Auto-detect mood from keywords
    const moodKeywords = {
      energized: ['excited', 'motivated', 'energetic', 'pumped', 'ready'],
      focused: ['concentrate', 'focus', 'clear', 'determined', 'sharp'],
      scattered: ['overwhelmed', 'scattered', 'confused', 'chaotic', 'jumbled'],
      reflective: ['thinking', 'wondering', 'reflecting', 'contemplating', 'pondering']
    };

    const detectedMood = Object.entries(moodKeywords).find(([_, keywords]) =>
      keywords.some(keyword => content.toLowerCase().includes(keyword))
    )?.[0] as Note['mood'];

    // Auto-detect urgency
    const urgencyKeywords = {
      now: ['urgent', 'immediately', 'asap', 'now', 'critical'],
      today: ['today', 'deadline', 'due', 'finish'],
      week: ['this week', 'soon', 'upcoming'],
      someday: ['maybe', 'someday', 'eventually', 'later']
    };

    const detectedUrgency = Object.entries(urgencyKeywords).find(([_, keywords]) =>
      keywords.some(keyword => content.toLowerCase().includes(keyword))
    )?.[0] as Note['urgency'];

    return {
      id: `note-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      title: generateTitle(content),
      content: content.trim(),
      type: 'quick',
      category: 'general',
      tags: hashtags,
      timestamp,
      lastEdited: timestamp,
      pinned: false,
      mood: detectedMood,
      urgency: detectedUrgency || 'someday',
      energy: detectEnergyLevel(content),
      metadata: {
        wordCount,
        hasHashtags,
        hasTasks,
        topics: [],
        actionItems: extractActionItems(content)
      }
    };
  };

  const generateTitle = (content: string): string => {
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 50) {
      return firstLine.substring(0, 47) + '...';
    }
    return firstLine || `Quick Note - ${new Date().toLocaleTimeString()}`;
  };

  const detectEnergyLevel = (content: string): Note['energy'] => {
    const highEnergyWords = ['excited', 'amazing', 'fantastic', 'energetic', 'motivated'];
    const lowEnergyWords = ['tired', 'exhausted', 'drained', 'overwhelmed', 'difficult'];

    const contentLower = content.toLowerCase();

    if (highEnergyWords.some(word => contentLower.includes(word))) {
      return 'high';
    }
    if (lowEnergyWords.some(word => contentLower.includes(word))) {
      return 'low';
    }
    return 'medium';
  };

  const extractActionItems = (content: string): string[] => {
    const actionPattern = /(?:^|\n)(?:-|\*|\d+\.)\s*(.+)/g;
    const matches = [];
    let match;

    while ((match = actionPattern.exec(content)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const note = generateNote();
      await onSave(note);
      setContent('');
      setIsCapturing(false);
    } catch (error) {
      console.error('Failed to save quick note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsCapturing(false);
      setContent('');
    }
  };

  const handleStartCapture = () => {
    setIsCapturing(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  if (!isCapturing) {
    return (
      <div className="quick-capture-closed">
        <button className="quick-capture-button" onClick={handleStartCapture}>
          <AppIcon className="capture-icon" name="pencil" size={18} />
          <span className="capture-text">Quick Note</span>
          <span className="capture-hint">Capture a thought instantly</span>
        </button>
      </div>
    );
  }

  return (
    <div className="quick-capture">
      <div className="capture-header">
        <span className="capture-title">Quick Capture</span>
        <div className="capture-actions">
          <button
            className="action-button save-button"
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
          >
            <AppIcon
              className={isLoading ? 'button-icon spin-icon' : 'button-icon'}
              name={isLoading ? 'loader' : 'save'}
              size={14}
            />
            <span>Save</span>
          </button>
          <button
            className="action-button cancel-button"
            onClick={() => {
              setIsCapturing(false);
              setContent('');
            }}
          >
            <AppIcon className="button-icon" name="x" size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="capture-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind? Use #tags, mention urgency (urgent, today, soon), or describe your mood..."
        rows={4}
        maxLength={5000}
      />

      <div className="capture-footer">
        <div className="capture-hints">
          <span className="hint">⌘/Ctrl + Enter to save</span>
          <span className="hint">Esc to cancel</span>
          <span className="hint">Use #hashtags for auto-tagging</span>
        </div>
        <div className="character-count">
          {content.length}/5000
        </div>
      </div>
    </div>
  );
};

export default QuickCapture;

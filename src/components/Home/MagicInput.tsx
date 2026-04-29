import React, { useState, useRef, useEffect } from 'react';
import './MagicInput.css';

interface MagicInputProps {
  onIntentDetected: (intent: Intent) => void;
}

export interface Intent {
  type: 'task' | 'event' | 'focus' | 'bookmark' | 'question' | 'unknown';
  rawInput: string;
  parsedData: {
    text?: string;
    datetime?: Date;
    duration?: number;
    url?: string;
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
  };
  confidence: number;
}

const MagicInput: React.FC<MagicInputProps> = ({ onIntentDetected }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholder, setPlaceholder] = useState("What's on your mind?");
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderRotation = [
    "What's on your mind?",
    "Try: 'Meeting tomorrow at 3pm'",
    "Try: 'Focus for 45 minutes'",
    "Try: 'Save this article'",
    "Try: 'Block 2 hours for deep work'",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = placeholderRotation.indexOf(prev);
        return placeholderRotation[(currentIndex + 1) % placeholderRotation.length];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const parseIntent = async (text: string): Promise<Intent> => {
    const lower = text.toLowerCase();

    // Time patterns
    const timePatterns = {
      today: /today|tonight|this evening/i,
      tomorrow: /tomorrow/i,
      time: /(\d{1,2})(:\d{2})?\s*(am|pm)?|\d{1,2}:\d{2}/i,
      duration: /(\d+)\s*(hour|hr|minute|min|m)/i,
      deadline: /by\s+|before\s+|until\s+/i,
    };

    // Action keywords
    const actions = {
      task: /remind|todo|task|need to|have to|should|must/i,
      event: /meeting|appointment|call|interview|presentation/i,
      focus: /focus|concentrate|work|study|deep work|pomodoro/i,
      bookmark: /save|bookmark|read later|article|link/i,
      schedule: /schedule|block|plan|arrange/i,
    };

    let intent: Intent = {
      type: 'unknown',
      rawInput: text,
      parsedData: { text },
      confidence: 0,
    };

    // Focus detection
    if (actions.focus.test(lower) || timePatterns.duration.test(lower)) {
      const durationMatch = lower.match(/(\d+)\s*(hour|hr|minute|min|m)/i);
      intent.type = 'focus';
      intent.confidence = 0.9;

      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        intent.parsedData.duration = unit.startsWith('h') ? value * 60 : value;
      } else {
        intent.parsedData.duration = 25; // Default pomodoro
      }
    }

    // Event detection
    else if (actions.event.test(lower) || (timePatterns.time.test(lower) && timePatterns.today.test(lower))) {
      intent.type = 'event';
      intent.confidence = 0.85;
      intent.parsedData.datetime = extractDateTime(text);
    }

    // Task detection
    else if (actions.task.test(lower) || timePatterns.deadline.test(lower)) {
      intent.type = 'task';
      intent.confidence = 0.8;
      intent.parsedData.priority = extractPriority(text);
      intent.parsedData.datetime = extractDateTime(text);
    }

    // Bookmark detection
    else if (actions.bookmark.test(lower) || lower.includes('this')) {
      intent.type = 'bookmark';
      intent.confidence = 0.85;

      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        intent.parsedData.url = tab.url;
        intent.parsedData.text = tab.title || text;
      }
    }

    // Default to task if unclear
    else {
      intent.type = 'task';
      intent.confidence = 0.5;
      intent.parsedData.priority = 'medium';
    }

    return intent;
  };

  const extractDateTime = (text: string): Date => {
    const now = new Date();
    const lower = text.toLowerCase();

    if (lower.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return extractTimeOfDay(text, tomorrow);
    }

    if (lower.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }

    return extractTimeOfDay(text, now);
  };

  const extractTimeOfDay = (text: string, baseDate: Date): Date => {
    const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm)?/i);

    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const isPM = timeMatch[3]?.toLowerCase() === 'pm';
      const adjustedHours = isPM && hours !== 12 ? hours + 12 : hours;

      baseDate.setHours(adjustedHours, 0, 0, 0);
    }

    return baseDate;
  };

  const extractPriority = (text: string): 'high' | 'medium' | 'low' => {
    if (/urgent|asap|important|critical|high/i.test(text)) return 'high';
    if (/low|whenever|maybe/i.test(text)) return 'low';
    return 'medium';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const intent = await parseIntent(input);

      // Send to MCP for enhanced processing if confidence is low
      if (intent.confidence < 0.7) {
        // This will be handled by the parent component via MCP
        intent.parsedData.text = input;
      }

      onIntentDetected(intent);
      setInput('');
    } catch (error) {
      console.error('Failed to process input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInput('');
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="magic-input-container">
      <div className={`magic-input-wrapper ${isProcessing ? 'processing' : ''}`}>
        <span className="magic-input-icon">💭</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="magic-input"
          disabled={isProcessing}
          autoComplete="off"
          autoFocus
        />
        {input && (
          <button
            type="submit"
            className="magic-input-submit"
            disabled={isProcessing}
          >
            {isProcessing ? '...' : '→'}
          </button>
        )}
      </div>
      {isProcessing && (
        <div className="magic-input-status">
          Understanding your request...
        </div>
      )}
    </form>
  );
};

export default MagicInput;
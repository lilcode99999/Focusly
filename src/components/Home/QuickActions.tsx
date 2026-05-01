import React, { useCallback, useEffect, useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import { saveBookmark } from '@/services/localBookmarks';
import { markOnboardingStep } from '@/services/localOnboarding';
import { EnergyLevel } from '@/types/bookmark';
import './QuickActions.css';

interface SaveDraft {
  title: string;
  url: string;
  whySaved: string;
  nextAction: string;
  tags: string;
  note: string;
  mood: string;
  energy: '' | EnergyLevel;
}

interface QuickActionsProps {
  openSaveComposerSignal?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ openSaveComposerSignal = 0 }) => {
  const [saveDraft, setSaveDraft] = useState<SaveDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState('');

  const handlePrepareBookmark = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && tab.title) {
      const domain = new URL(tab.url).hostname.replace(/^www\./, '');

      setSaveDraft({
        title: tab.title,
        url: tab.url,
        whySaved: '',
        nextAction: '',
        tags: domain ? domain.split('.').slice(0, 1).join('') : '',
        note: '',
        mood: '',
        energy: '',
      });
      setSaveStatus('');
    }
  }, []);

  useEffect(() => {
    if (openSaveComposerSignal > 0) {
      handlePrepareBookmark();
    }
  }, [handlePrepareBookmark, openSaveComposerSignal]);

  const handleStartFocus = () => {
    // Switch to focus tab and start timer
    chrome.runtime.sendMessage({
      type: 'START_FOCUS_SESSION',
      data: {
        goal: 'Choose one saved item or next action to work on',
      },
    });
  };

  const handleQuickSearch = () => {
    // Focus search input in library tab
    chrome.runtime.sendMessage({ type: 'OPEN_SEARCH' });
  };

  const updateDraft = <K extends keyof SaveDraft>(key: K, value: SaveDraft[K]) => {
    setSaveDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const parseTags = (tags: string) => (
    tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  );

  const handleSaveBookmark = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!saveDraft) {
      return;
    }

    try {
      const result = await saveBookmark({
        title: saveDraft.title,
        url: saveDraft.url,
        tags: parseTags(saveDraft.tags),
        note: saveDraft.note,
        whySaved: saveDraft.whySaved,
        mood: saveDraft.mood,
        energy: saveDraft.energy || undefined,
        nextAction: saveDraft.nextAction,
        sourceTabTitle: saveDraft.title,
      });

      setSaveDraft(null);
      setSaveStatus(result.created ? 'Saved with context.' : 'Updated with fresh context.');
      if (saveDraft.whySaved.trim() && saveDraft.nextAction.trim()) {
        await markOnboardingStep('savedFirstContext');
      }
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      setSaveStatus('Could not save this page yet.');
    }
  };

  return (
    <div className="quick-actions">
      <h3 className="section-title">Quick Actions</h3>
      <div className="action-buttons">
        <button className="action-button primary" onClick={handlePrepareBookmark}>
          <AppIcon className="action-icon" name="bookmark-plus" size={18} />
          <span className="action-label">Save Current Tab</span>
        </button>
        <button className="action-button" onClick={handleStartFocus}>
          <AppIcon className="action-icon" name="target" size={18} />
          <span className="action-label">Start Focus</span>
        </button>
        <button className="action-button" onClick={handleQuickSearch}>
          <AppIcon className="action-icon" name="search" size={18} />
          <span className="action-label">Search Library</span>
        </button>
      </div>
      {saveStatus && (
        <p className="save-status" role="status">
          {saveStatus}
        </p>
      )}
      {saveDraft && (
        <form className="save-context-form" onSubmit={handleSaveBookmark}>
          <div className="save-context-page">
            <span className="save-context-title">{saveDraft.title}</span>
            <span className="save-context-url">{new URL(saveDraft.url).hostname}</span>
          </div>

          <label className="context-field">
            <span>Why save this?</span>
            <textarea
              value={saveDraft.whySaved}
              onChange={(event) => updateDraft('whySaved', event.target.value)}
              placeholder="Future me needs this for..."
              required
              rows={2}
            />
          </label>

          <label className="context-field">
            <span>Next action</span>
            <input
              type="text"
              value={saveDraft.nextAction}
              onChange={(event) => updateDraft('nextAction', event.target.value)}
              placeholder="Read, compare, reply, build..."
              required
            />
          </label>

          <details className="save-context-details">
            <summary>Add tags, note, mood, or energy</summary>
            <label className="context-field">
              <span>Tags</span>
              <input
                type="text"
                value={saveDraft.tags}
                onChange={(event) => updateDraft('tags', event.target.value)}
                placeholder="research, design, reference"
              />
            </label>
            <label className="context-field">
              <span>Note</span>
              <textarea
                value={saveDraft.note}
                onChange={(event) => updateDraft('note', event.target.value)}
                placeholder="Anything worth remembering?"
                rows={2}
              />
            </label>
            <div className="context-row">
              <label className="context-field">
                <span>Mood</span>
                <input
                  type="text"
                  value={saveDraft.mood}
                  onChange={(event) => updateDraft('mood', event.target.value)}
                  placeholder="curious, stuck..."
                />
              </label>
              <label className="context-field">
                <span>Energy</span>
                <select
                  value={saveDraft.energy}
                  onChange={(event) => updateDraft('energy', event.target.value as SaveDraft['energy'])}
                >
                  <option value="">Any</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </details>

          <div className="save-context-actions">
            <button type="button" className="context-cancel" onClick={() => setSaveDraft(null)}>
              Cancel
            </button>
            <button type="submit" className="context-save">
              Save Context
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default QuickActions;

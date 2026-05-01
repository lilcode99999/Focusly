import React, { useEffect, useState } from 'react';
import AppIcon, { AppIconName } from '@/components/common/AppIcon';
import './ContextCards.css';

export interface ContextCard {
  id: string;
  type: 'suggestion' | 'reminder' | 'insight' | 'task' | 'event';
  title: string;
  description?: string;
  detailRows?: {
    label: string;
    value: string;
  }[];
  action?: {
    label: string;
    handler: () => void;
  };
  secondaryAction?: {
    label: string;
    handler: () => void;
  };
  icon?: string;
  priority?: 'high' | 'medium' | 'low';
  timestamp?: Date;
}

interface ContextCardsProps {
  cards: ContextCard[];
  onCardAction?: (card: ContextCard) => void;
  onDismiss?: (cardId: string) => void;
}

const ContextCards: React.FC<ContextCardsProps> = ({ cards, onCardAction, onDismiss }) => {
  const [visibleCards, setVisibleCards] = useState<ContextCard[]>([]);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filter out dismissed cards and limit to 3 most relevant
    const filtered = cards
      .filter(card => !dismissedCards.has(card.id))
      .slice(0, 3);
    setVisibleCards(filtered);
  }, [cards, dismissedCards]);

  const handleDismiss = (cardId: string) => {
    setDismissedCards(prev => new Set(prev).add(cardId));
    onDismiss?.(cardId);

    // Store dismissed cards for the session
    chrome.storage.session.set({
      dismissedCards: Array.from(dismissedCards).concat(cardId)
    });
  };

  const normalizeCardIcon = (icon?: string): AppIconName | undefined => {
    switch (icon) {
      case 'alert':
      case 'arrow-right':
      case 'bar-chart':
      case 'bell':
      case 'book':
      case 'bookmark-plus':
      case 'calendar':
      case 'check':
      case 'check-circle':
      case 'circle':
      case 'clock':
      case 'coffee':
      case 'lightbulb':
      case 'refresh':
      case 'search':
      case 'sun':
      case 'sunrise':
      case 'tags':
      case 'target':
      case 'timer':
        return icon;
      case '\u{1F305}':
        return 'sunrise';
      case '\u2600\uFE0F':
        return 'sun';
      case '\u23F1\uFE0F':
      case '\u23F0':
        return 'timer';
      case '\u2615':
        return 'coffee';
      case '\u{1F4A1}':
        return 'lightbulb';
      case '\u{1F514}':
        return 'bell';
      case '\u{1F4CA}':
        return 'bar-chart';
      case '\u2705':
      case '\u2713':
      case '\u2728':
        return 'check-circle';
      case '\u{1F4C5}':
        return 'calendar';
      case '\u26A0\uFE0F':
      case '\u{1F6AB}':
        return 'alert';
      case '\u{1F3F7}\uFE0F':
        return 'tags';
      case '\u{1F4DA}':
        return 'book';
      case '\u{1F4CC}':
        return 'bookmark-plus';
      case '\u2192':
        return 'arrow-right';
      case '\u21BA':
        return 'refresh';
      case '\u25CE':
        return 'circle';
      default:
        return undefined;
    }
  };

  const getCardIcon = (card: ContextCard): AppIconName => {
    const explicitIcon = normalizeCardIcon(card.icon);
    if (explicitIcon) return explicitIcon;

    switch (card.type) {
      case 'suggestion': return 'lightbulb';
      case 'reminder': return 'bell';
      case 'insight': return 'bar-chart';
      case 'task': return 'check';
      case 'event': return 'calendar';
      default: return 'bookmark-plus';
    }
  };

  const getCardClassName = (card: ContextCard): string => {
    const classes = ['context-card', `card-${card.type}`];
    if (card.priority) classes.push(`priority-${card.priority}`);
    return classes.join(' ');
  };

  const formatTime = (date?: Date): string => {
    if (!date) return '';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (visibleCards.length === 0) {
    return (
      <div className="context-cards-empty">
        <AppIcon className="empty-icon" name="book" size={32} />
        <p>Save a page with a reason and this space will help you return to it.</p>
      </div>
    );
  }

  return (
    <div className="context-cards-container">
      {visibleCards.map((card, index) => (
        <div
          key={card.id}
          className={getCardClassName(card)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <button
            className="card-dismiss"
            onClick={() => handleDismiss(card.id)}
            aria-label="Dismiss"
          >
            <AppIcon name="x" size={14} />
          </button>

          <div className="card-header">
            <AppIcon className="card-icon" name={getCardIcon(card)} size={20} />
            <div className="card-content">
              <h4 className="card-title">{card.title}</h4>
              {card.description && (
                <p className="card-description">{card.description}</p>
              )}
              {card.detailRows && card.detailRows.length > 0 && (
                <dl className="card-details">
                  {card.detailRows.map((row) => (
                    <div key={row.label} className="card-detail-row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {card.timestamp && (
              <span className="card-time">{formatTime(card.timestamp)}</span>
            )}
          </div>

          {card.action && (
            <div className="card-actions">
              <button
                className="card-action"
                onClick={() => {
                  card.action!.handler();
                  onCardAction?.(card);
                }}
              >
                {card.action.label}
              </button>
              {card.secondaryAction && (
                <button
                  className="card-action secondary"
                  onClick={() => {
                    card.secondaryAction!.handler();
                    onCardAction?.(card);
                  }}
                >
                  {card.secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextCards;

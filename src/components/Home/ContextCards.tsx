import React, { useEffect, useState } from 'react';
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

  const getCardIcon = (card: ContextCard): string => {
    if (card.icon) return card.icon;

    switch (card.type) {
      case 'suggestion': return '💡';
      case 'reminder': return '🔔';
      case 'insight': return '📊';
      case 'task': return '✓';
      case 'event': return '📅';
      default: return '📌';
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
        <span className="empty-icon">✨</span>
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
            ×
          </button>

          <div className="card-header">
            <span className="card-icon">{getCardIcon(card)}</span>
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

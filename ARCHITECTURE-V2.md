# Smart Bookmarks v2.0 - Future-Ready Architecture

## Overview
Smart Bookmarks v2.0 implements a scalable, component-based architecture designed to evolve from a bookmark manager to a comprehensive "Operating System for Neurodivergent Productivity."

## Core Philosophy
- **Scalable by Design**: Every component built to accommodate future features
- **ADHD-Optimized**: Cognitive load management and energy-aware interfaces
- **Progressive Enhancement**: Features unlock as user needs grow
- **Component-Based**: Modular widgets and pluggable integrations

## Architecture Components

### 1. Universal Search Engine
**Purpose**: Single search interface that scales across all data sources

**Current Implementation (Phase 1)**:
- Context filters: All, Bookmarks
- Local bookmark search
- Relevance ranking with recency decay

**Future Phases**:
- Phase 3: + Calendar, Tasks contexts
- Phase 4: + Voice capture, Brain dump contexts  
- Phase 5: + Notion, Gmail, Drive, Slack (MCP integration)
- Phase 6: AI semantic search across everything

**Key Files**:
- `UniversalSearchEngine` class in `popup-v2.js`
- Context filters in `popup-v2.html`

### 2. Adaptive Tab Router
**Purpose**: Dynamic navigation that scales with enabled features

**Current Implementation (Phase 1)**:
- Hub, Focus, Settings tabs
- Keyboard navigation (Cmd/Ctrl + 1/2/3)
- Tab state management

**Future Scaling**:
- Phase 2: + Body doubling sessions tab
- Phase 5: [Hub] [Focus] [Time] [Tools] [More]
- Dynamic tab visibility based on user's enabled features
- Overflow handling for 5+ tabs

**Key Files**:
- `AdaptiveTabRouter` class in `popup-v2.js`
- Tab navigation UI in `popup-v2.html`

### 3. Component Widget System
**Purpose**: Modular, pluggable components for each feature area

**Current Widgets**:
- Quick Actions (Save Page, Focus, Capture)
- Recent Items (Bookmarks list)
- Today's Progress (Stats display)
- Focus Timer (Pomodoro with ADHD optimizations)

**Widget Architecture**:
```javascript
class Widget {
  render(container) { /* render UI */ }
  refresh() { /* update data */ }
  destroy() { /* cleanup */ }
}
```

**Future Widgets**:
- Body Doubling Sessions
- Connected Tools Status
- Energy Level Tracker
- Achievement System
- Calendar Integration
- Voice Capture Interface

### 4. Scalable Data Layer
**Purpose**: Unified data access across multiple sources

**Current Sources**:
- `LocalStorageSource`: Free tier bookmarks (100 limit)

**Future Sources**:
- `SupabaseSource`: Cloud sync for Pro users
- `MCPSource`: External tool integrations
- `CalendarSource`: Calendar data
- `NotionSource`: Notion pages and databases
- `VoiceSource`: Voice recordings and transcripts

**Data Flow**:
```
Widget Request → DataLayer → Source → Cache → Widget
                     ↓
              Background Sync
```

### 5. User Context Engine
**Purpose**: ADHD-aware personalization and adaptation

**Current Features**:
- Energy level detection (high/medium/low)
- Search pattern analysis
- Tab usage tracking
- Cognitive load monitoring

**ADHD Support Features**:
- **Energy-Aware UI**: Adapts interface based on detected energy
- **Cognitive Load Management**: Simplifies UI when overwhelmed
- **Pattern Recognition**: Learns user behavior for suggestions
- **Gentle Notifications**: Non-jarring feedback system

**Future Enhancements**:
- Time blindness support with visual time indicators
- Executive function assistance
- Transition helpers for task switching
- Burnout prevention through usage patterns

### 6. MCP Integration Layer
**Purpose**: Connect external productivity tools via Model Context Protocol

**Phase 5 Integrations**:
- Notion (pages, databases, quick capture)
- Gmail (search, quick compose)
- Google Drive (file search, recent documents)
- Slack (messages, channels, quick DM)
- Calendar (events, scheduling)
- Task managers (Todoist, Things, etc.)

**Integration Architecture**:
```
External Tool ↔ MCP Server ↔ Integration Layer ↔ Search Engine
                                     ↓
                              Universal Search Results
```

## Scaling Timeline

### Phase 1 (Current) - Foundation
- ✅ Universal search (bookmarks only)
- ✅ Adaptive tabs (Hub, Focus, Settings)
- ✅ Widget system foundation
- ✅ Local data layer
- ✅ ADHD context engine
- ✅ Energy level monitoring

### Phase 2 - Social Features
- Body doubling sessions tab
- Virtual coworking spaces
- Focus accountability partners
- Shared focus timers

### Phase 3 - Calendar & Tasks
- Calendar widget and search context
- Task management integration
- Time blocking features
- Schedule-aware suggestions

### Phase 4 - Capture & Voice
- Voice capture widget
- Brain dump quick capture
- Voice-to-text transcription
- Audio note search

### Phase 5 - Connected Ecosystem
- MCP tool integrations
- Cross-platform search
- Unified inbox concept
- Smart suggestions across tools

### Phase 6 - AI Intelligence
- Semantic search across everything
- AI-powered insights
- Automated organization
- Predictive assistance

## Technical Implementation Details

### Component Registration
```javascript
// Widgets auto-register based on enabled features
widgetSystem.registerWidget('quick-actions', QuickActionsWidget);
widgetSystem.registerWidget('recent-items', RecentItemsWidget);
widgetSystem.registerWidget('focus-timer', FocusTimerWidget);

// Future widgets register conditionally
if (features.has('body-doubling')) {
  widgetSystem.registerWidget('body-doubling', BodyDoublingWidget);
}
```

### Search Context Expansion
```javascript
// Current contexts
const contexts = ['all', 'bookmarks'];

// Phase 3 addition
contexts.push('calendar', 'tasks');

// Phase 5 addition  
contexts.push('notion', 'gmail', 'drive', 'slack');

// Context filters update automatically
contextFilters.render(contexts);
```

### Energy-Aware Adaptation
```javascript
// Low energy mode automatically triggered
if (energyLevel === 'low') {
  ui.simplifyInterface();
  ui.reduceAnimations();
  ui.enableGentleMode();
  suggestions.suggestBreak();
}
```

## ADHD-Specific Features

### Cognitive Load Management
- **Visual Complexity Monitoring**: Tracks UI element count
- **Progressive Disclosure**: Shows only essential features initially
- **Load Indicators**: Brain emoji showing cognitive state
- **Auto-Simplification**: Reduces UI when overwhelmed

### Energy Level System
- **Automatic Detection**: Analyzes usage patterns
- **Manual Override**: Click indicator to set level
- **Adaptive Interface**: UI changes based on energy
- **Gentle Suggestions**: Recommends breaks during low energy

### Time Blindness Support
- **Visual Time Indicators**: Clear progress displays
- **Gentle Reminders**: Non-jarring notifications
- **Session Awareness**: Tracks focus session length
- **Break Suggestions**: Prevents hyperfocus burnout

### Executive Function Support
- **Quick Actions**: Reduce decision fatigue
- **One-Click Operations**: Minimize steps for common tasks
- **Context Preservation**: Remember where user left off
- **Gentle Guidance**: Subtle suggestions without overwhelm

## Performance Considerations

### Lazy Loading
- Widgets load only when visible
- Search contexts activate on demand
- Heavy features initialize progressively

### Caching Strategy
- Recent items cached for 30 seconds
- Search results cached by query + context
- User context synced every 5 minutes
- Stats updated every minute

### Memory Management
- Widget cleanup on tab switch
- Event listener removal
- Cache size limits (100 items max)
- Garbage collection triggers

## Migration Path

### From v1 to v2
1. User preferences automatically migrated
2. Local bookmarks preserved
3. New features gradually introduced
4. Old UI remains accessible during transition

### Future Migrations
- Feature flags control new widget visibility
- Data migrates between storage sources
- User consent required for new integrations
- Gradual feature rollout prevents overwhelm

## Development Guidelines

### Adding New Features
1. Create widget component
2. Register with widget system
3. Add data source if needed
4. Update search contexts
5. Add to adaptive tab router
6. Test ADHD usability

### ADHD Design Principles
1. **Reduce Cognitive Load**: Fewer choices, clearer paths
2. **Respect Energy Levels**: Adapt to user state
3. **Gentle Feedback**: Avoid jarring interactions
4. **Quick Wins**: Immediate value for actions
5. **Progressive Enhancement**: Features unlock gradually

This architecture ensures Smart Bookmarks can scale from bookmark manager to comprehensive productivity OS while maintaining usability for neurodivergent users.
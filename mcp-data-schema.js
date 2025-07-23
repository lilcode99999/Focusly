/**
 * MCP Data Schema for Smart Bookmarks Extension
 * This file defines the data structures for AI/MCP integration in Phase 5
 */

// Note structure with enhanced AI metadata
const MCPNoteSchema = {
  // Core fields
  id: 'string', // Unique identifier
  content: 'string', // Plain text content
  htmlContent: 'string', // HTML formatted content
  title: 'string', // Note title (extracted or user-defined)
  timestamp: 'number', // Creation timestamp
  lastEdited: 'number', // Last edit timestamp
  category: 'string', // general, focus, task, idea, etc.
  pinned: 'boolean', // Pinned status
  
  // AI Metadata fields
  metadata: {
    wordCount: 'number',
    hasHashtags: 'boolean',
    hasTasks: 'boolean',
    sentiment: 'string|null', // positive, negative, neutral
    topics: 'array<string>', // AI-extracted topics
    actionItems: 'array<{text: string, priority: string, completed: boolean}>',
    
    // ADHD-specific metadata
    overwhelmLevel: 'number|null', // 1-10 scale
    focusContext: 'string|null', // What user was focusing on
    distractionTriggers: 'array<string>', // Identified distraction patterns
    structureScore: 'number|null', // How well-structured the note is (0-100)
  },
  
  // MCP Context fields
  context: {
    userGoals: 'object', // Current user goals
    focusHistory: 'array<object>', // Recent focus sessions
    currentMood: 'string|null', // User's current mood/energy level
    relatedNotes: 'array<string>', // IDs of related notes
    timeOfDay: 'string', // morning, afternoon, evening, night
    productivityScore: 'number|null', // Current productivity level
  },
  
  // AI Processing flags
  aiProcessing: {
    analyzed: 'boolean', // Has been analyzed by AI
    lastAnalyzed: 'number|null', // Timestamp of last analysis
    needsReanalysis: 'boolean', // Flag for re-processing
    extractedInsights: 'array<object>', // AI-generated insights
  }
};

// Focus Session structure with AI enhancements
const MCPFocusSessionSchema = {
  // Core fields
  id: 'string',
  timestamp: 'number',
  duration: 'number', // in minutes
  completed: 'boolean',
  startTime: 'number',
  endTime: 'number',
  actualDuration: 'number', // actual time focused
  mode: 'string', // focus or break
  
  // AI Analysis fields
  analysis: {
    effectiveness: 'number|null', // 0-100 score
    distractionCount: 'number',
    flowStateAchieved: 'boolean',
    optimalTiming: 'boolean', // Was this at user's optimal time?
    environmentFactors: 'object', // Noise level, location, etc.
    
    // ADHD-specific metrics
    hyperfocusDetected: 'boolean',
    taskSwitchingCount: 'number',
    breakNeededSignals: 'array<string>', // Signs user needed a break
    completionPrediction: 'number', // Likelihood of completion
  },
  
  // Session notes
  notes: {
    preSession: 'string|null', // What user planned to focus on
    postSession: 'string|null', // What was actually accomplished
    blockers: 'array<string>', // What prevented focus
    achievements: 'array<string>', // What went well
  },
  
  // Recommendations for next session
  aiRecommendations: {
    suggestedDuration: 'number',
    suggestedBreak: 'number',
    environmentTips: 'array<string>',
    taskBreakdown: 'array<string>', // How to break down tasks
  }
};

// Bookmark structure with AI enhancements
const MCPBookmarkSchema = {
  // Core fields
  id: 'string',
  url: 'string',
  title: 'string',
  dateAdded: 'number',
  lastVisited: 'number|null',
  visitCount: 'number',
  
  // AI Metadata
  metadata: {
    category: 'string', // AI-categorized
    relevanceScore: 'number', // How relevant to user's goals
    productivityImpact: 'string', // positive, negative, neutral
    contentSummary: 'string|null', // AI-generated summary
    keyTopics: 'array<string>',
    readingTime: 'number', // Estimated minutes
    
    // ADHD-specific
    distractionRisk: 'string', // high, medium, low
    dopamineType: 'string', // educational, entertainment, social
    focusCompatible: 'boolean', // Can be accessed during focus
  },
  
  // Usage patterns
  usagePatterns: {
    typicalTimeOfDay: 'array<string>',
    averageTimeSpent: 'number',
    associatedTasks: 'array<string>',
    moodCorrelation: 'object',
  }
};

// User Profile for AI Context
const MCPUserProfile = {
  // Basic info
  userId: 'string',
  createdAt: 'number',
  
  // ADHD Profile
  adhdProfile: {
    primaryChallenges: 'array<string>', // task initiation, time blindness, etc.
    strengthAreas: 'array<string>', // creativity, hyperfocus topics, etc.
    medicationTracking: 'boolean', // Opt-in medication reminder correlation
    preferredStructureLevel: 'string', // high, medium, low
  },
  
  // Productivity Patterns
  productivityPatterns: {
    optimalFocusDuration: 'number', // in minutes
    optimalBreakDuration: 'number',
    bestProductiveTimes: 'array<{start: string, end: string}>',
    worstProductiveTimes: 'array<{start: string, end: string}>',
    averageCompletionRate: 'number',
    
    // Environmental factors
    preferredEnvironment: 'object',
    musicPreference: 'string', // helps, hurts, depends
    bodyDoublingEffectiveness: 'number', // 0-100
  },
  
  // Goals and Priorities
  goals: {
    daily: 'array<object>',
    weekly: 'array<object>',
    longTerm: 'array<object>',
    currentPriorities: 'array<string>',
  },
  
  // AI Interaction Preferences
  aiPreferences: {
    communicationStyle: 'string', // encouraging, direct, gentle
    reminderFrequency: 'string', // high, medium, low
    insightDepth: 'string', // detailed, summary, visual
    motivationalStyle: 'string', // cheerleader, coach, companion
  }
};

// AI Conversation Context for MCP
const MCPConversationContext = {
  // Current state
  currentFocus: 'string|null',
  lastInteraction: 'number',
  currentMood: 'string',
  energyLevel: 'number', // 1-10
  
  // Recent activity
  recentNotes: 'array<MCPNoteSchema>',
  recentSessions: 'array<MCPFocusSessionSchema>',
  recentBookmarks: 'array<MCPBookmarkSchema>',
  
  // Insights
  currentInsights: {
    productivityTrend: 'string', // improving, declining, stable
    focusQuality: 'string', // high, medium, low
    overwhelmIndicators: 'array<string>',
    successPatterns: 'array<string>',
    strugglePatterns: 'array<string>',
  },
  
  // Recommendations ready
  pendingRecommendations: {
    taskPrioritization: 'array<object>',
    focusSessionSuggestion: 'object',
    breakSuggestion: 'object',
    environmentOptimization: 'array<string>',
  }
};

// Export schemas for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MCPNoteSchema,
    MCPFocusSessionSchema,
    MCPBookmarkSchema,
    MCPUserProfile,
    MCPConversationContext
  };
}
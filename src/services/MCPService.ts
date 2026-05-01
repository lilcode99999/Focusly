import { Intent } from '@/components/Home/MagicInput';
import { ContextCard } from '@/components/Home/ContextCards';

export interface MCPConfig {
  localOnly: boolean;
}

export interface ProcessedIntent {
  intent: Intent;
  suggestedActions: ContextCard[];
  autoExecute?: boolean;
  confidence: number;
}

class MCPService {
  private userPatterns: Map<string, any> = new Map();

  constructor() {
    this.loadUserPatterns();
  }

  private async loadUserPatterns() {
    try {
      const result = await chrome.storage.local.get(['userPatterns']);
      if (result.userPatterns) {
        this.userPatterns = new Map(Object.entries(result.userPatterns));
      }
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  }

  async processIntent(intent: Intent): Promise<ProcessedIntent> {
    // First, try local pattern matching for speed
    const quickMatch = this.quickPatternMatch(intent);
    if (quickMatch.confidence > 0.8) {
      return quickMatch;
    }

    // For complex intents, route to appropriate AI
    switch (intent.type) {
      case 'task':
      case 'event':
        return this.processSchedulingIntent(intent);

      case 'focus':
        return this.processFocusIntent(intent);

      case 'bookmark':
        return this.processBookmarkIntent(intent);

      default:
        return this.processGeneralIntent(intent);
    }
  }

  private quickPatternMatch(intent: Intent): ProcessedIntent {
    const suggestedActions: ContextCard[] = [];
    let confidence = intent.confidence;

    // Check user's common patterns
    const timeOfDay = new Date().getHours();

    // Morning patterns
    if (timeOfDay >= 6 && timeOfDay < 12) {
      if (intent.rawInput.toLowerCase().includes('focus')) {
        suggestedActions.push({
          id: 'morning-focus',
          type: 'suggestion',
          title: 'Your best focus time is usually 9-11am',
          description: 'Based on your past sessions',
          icon: '🌅',
        });
        confidence = 0.9;
      }
    }

    // Common task patterns
    if (intent.type === 'task') {
      const taskKeywords = this.extractTaskKeywords(intent.rawInput);
      const similarTasks = this.findSimilarPastTasks(taskKeywords);

      if (similarTasks.length > 0) {
        suggestedActions.push({
          id: 'similar-task',
          type: 'insight',
          title: 'Similar tasks usually take you ~' + similarTasks[0].averageDuration + ' minutes',
          icon: '⏱️',
        });
        confidence = 0.85;
      }
    }

    return {
      intent,
      suggestedActions,
      autoExecute: confidence > 0.9,
      confidence,
    };
  }

  private async processSchedulingIntent(intent: Intent): Promise<ProcessedIntent> {
    const suggestedActions: ContextCard[] = [];

    // Analyze calendar for optimal slot
    const optimalSlot = await this.findOptimalTimeSlot(intent);

    if (optimalSlot) {
      suggestedActions.push({
        id: 'optimal-slot',
        type: 'suggestion',
        title: `Best time: ${this.formatTimeSlot(optimalSlot)}`,
        description: 'This slot has no conflicts and aligns with your productivity patterns',
        action: {
          label: 'Schedule',
          handler: () => this.scheduleAtTime(intent, optimalSlot),
        },
        icon: '📅',
        priority: 'high',
      });
    }

    // Add buffer time suggestion for ADHD
    if (intent.type === 'event') {
      suggestedActions.push({
        id: 'buffer-time',
        type: 'suggestion',
        title: 'Add 15min prep time before?',
        description: 'Helps with task transition',
        action: {
          label: 'Add buffer',
          handler: () => this.addBufferTime(intent),
        },
        icon: '⏰',
      });
    }

    // Check for potential conflicts
    const conflicts = await this.checkConflicts(intent);
    if (conflicts.length > 0) {
      suggestedActions.push({
        id: 'conflict-warning',
        type: 'reminder',
        title: 'Potential conflict detected',
        description: conflicts[0].description,
        icon: '⚠️',
        priority: 'high',
      });
    }

    return {
      intent,
      suggestedActions,
      autoExecute: false,
      confidence: 0.85,
    };
  }

  private async processFocusIntent(intent: Intent): Promise<ProcessedIntent> {
    const suggestedActions: ContextCard[] = [];
    const duration = intent.parsedData.duration || 25;

    // Check current context
    const currentTab = await this.getCurrentTab();
    const isDistractingSite = this.isDistractingSite(currentTab.url);

    if (isDistractingSite) {
      suggestedActions.push({
        id: 'distraction-warning',
        type: 'reminder',
        title: 'Close distracting tabs first?',
        description: `You're on ${new URL(currentTab.url!).hostname}`,
        action: {
          label: 'Close & Focus',
          handler: () => this.closeDistractingTabs(),
        },
        icon: '🚫',
        priority: 'high',
      });
    }

    // Suggest optimal duration based on time of day
    const optimalDuration = this.getOptimalFocusDuration();
    if (optimalDuration !== duration) {
      suggestedActions.push({
        id: 'duration-suggestion',
        type: 'suggestion',
        title: `Try ${optimalDuration} minutes instead?`,
        description: 'Based on your current energy levels',
        action: {
          label: `Use ${optimalDuration}min`,
          handler: () => this.updateDuration(intent, optimalDuration),
        },
        icon: '⏱️',
      });
    }

    // Add break reminder
    suggestedActions.push({
      id: 'break-reminder',
      type: 'insight',
      title: 'Break scheduled after session',
      description: '5 minute break will start automatically',
      icon: '☕',
    });

    return {
      intent,
      suggestedActions,
      autoExecute: !isDistractingSite,
      confidence: 0.9,
    };
  }

  private async processBookmarkIntent(intent: Intent): Promise<ProcessedIntent> {
    const suggestedActions: ContextCard[] = [];

    // Get AI-suggested tags
    const suggestedTags = await this.generateSmartTags(intent.parsedData.url);

    if (suggestedTags.length > 0) {
      suggestedActions.push({
        id: 'smart-tags',
        type: 'suggestion',
        title: 'Suggested tags',
        description: suggestedTags.join(', '),
        action: {
          label: 'Apply tags',
          handler: () => this.applyTags(intent, suggestedTags),
        },
        icon: '🏷️',
      });
    }

    // Check for duplicates
    const isDuplicate = await this.checkDuplicateBookmark(intent.parsedData.url);
    if (isDuplicate) {
      suggestedActions.push({
        id: 'duplicate-warning',
        type: 'reminder',
        title: 'You saved this before',
        description: 'Want to update the existing bookmark?',
        icon: '📌',
      });
    }

    // Suggest related bookmarks
    const related = await this.findRelatedBookmarks(intent.parsedData.url);
    if (related.length > 0) {
      suggestedActions.push({
        id: 'related-bookmarks',
        type: 'insight',
        title: `Related: ${related[0].title}`,
        description: 'You might want to group these',
        icon: '📚',
      });
    }

    return {
      intent,
      suggestedActions,
      autoExecute: !isDuplicate,
      confidence: 0.9,
    };
  }

  private async processGeneralIntent(intent: Intent): Promise<ProcessedIntent> {
    const context = await this.getUserContext();

    return {
      intent,
      suggestedActions: [{
        id: 'local-first-intent',
        type: 'insight',
        title: 'Captured locally',
        description: `Saved without cloud AI. Local context: ${this.formatUserContext(context)}.`,
        icon: '◎',
        priority: 'low',
      }],
      autoExecute: false,
      confidence: Math.max(intent.confidence, 0.5),
    };
  }

  // Helper methods
  private async findOptimalTimeSlot(intent: Intent): Promise<Date | null> {
    // This would integrate with calendar API
    const now = new Date();
    const proposedTime = intent.parsedData.datetime || now;

    // For demo, return next available hour
    proposedTime.setHours(proposedTime.getHours() + 1, 0, 0, 0);
    return proposedTime;
  }

  private formatTimeSlot(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  private async getCurrentTab(): Promise<chrome.tabs.Tab> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  private isDistractingSite(url?: string): boolean {
    if (!url) return false;
    const distractingSites = ['facebook', 'twitter', 'instagram', 'youtube', 'reddit'];
    return distractingSites.some(site => url.includes(site));
  }

  private getOptimalFocusDuration(): number {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return 45; // Morning: longer sessions
    if (hour >= 14 && hour <= 16) return 25; // Afternoon: standard pomodoros
    return 15; // Evening: shorter bursts
  }

  private extractTaskKeywords(text: string): string[] {
    // Simple keyword extraction
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['with', 'from', 'have', 'this', 'that'].includes(word));
  }

  private findSimilarPastTasks(keywords: string[]): any[] {
    // Would search through task history
    return [];
  }

  private async checkConflicts(intent: Intent): Promise<any[]> {
    // Would check calendar for conflicts
    return [];
  }

  private async generateSmartTags(url?: string): Promise<string[]> {
    if (!url) return [];

    // Simple tag generation based on URL
    const hostname = new URL(url).hostname;
    const tags = [];

    if (hostname.includes('github')) tags.push('development');
    if (hostname.includes('stackoverflow')) tags.push('reference');
    if (hostname.includes('medium')) tags.push('article');

    return tags;
  }

  private async checkDuplicateBookmark(url?: string): Promise<boolean> {
    if (!url) return false;

    const result = await chrome.storage.local.get(['bookmarks']);
    const bookmarks = result.bookmarks || [];
    return bookmarks.some((b: any) => b.url === url);
  }

  private async findRelatedBookmarks(url?: string): Promise<any[]> {
    // Would use AI to find semantically similar bookmarks
    return [];
  }

  private async getUserContext(): Promise<any> {
    const now = new Date();
    return {
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      // Add more context as needed
    };
  }

  private formatUserContext(context: { timeOfDay: number; dayOfWeek: number }): string {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayLabels[context.dayOfWeek]} ${context.timeOfDay}:00`;
  }

  // Action handlers
  private async scheduleAtTime(intent: Intent, time: Date) {
    // Implementation for scheduling
    console.log('Scheduling:', intent, 'at', time);
  }

  private async addBufferTime(intent: Intent) {
    // Implementation for adding buffer
    console.log('Adding buffer time for:', intent);
  }

  private async closeDistractingTabs() {
    // Implementation for closing tabs
    console.log('Closing distracting tabs');
  }

  private async updateDuration(intent: Intent, duration: number) {
    intent.parsedData.duration = duration;
    console.log('Updated duration to:', duration);
  }

  private async applyTags(intent: Intent, tags: string[]) {
    intent.parsedData.tags = tags;
    console.log('Applied tags:', tags);
  }

  // Generate proactive suggestions based on context
  async getProactiveSuggestions(): Promise<ContextCard[]> {
    const suggestions: ContextCard[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Morning suggestion
    if (hour === 9 && now.getMinutes() < 5) {
      suggestions.push({
        id: 'morning-focus',
        type: 'suggestion',
        title: 'Ready for your morning focus session?',
        description: 'You usually work best at this time',
        action: {
          label: 'Start 45min session',
          handler: () => this.startFocusSession(45),
        },
        icon: '☀️',
        priority: 'high',
      });
    }

    // End of day review
    if (hour === 17) {
      const tasksCompleted = await this.getCompletedTasksToday();
      suggestions.push({
        id: 'daily-review',
        type: 'insight',
        title: `You completed ${tasksCompleted} tasks today!`,
        description: 'Time for a quick review?',
        action: {
          label: 'Review day',
          handler: () => this.openDailyReview(),
        },
        icon: '📊',
      });
    }

    return suggestions;
  }

  private async startFocusSession(duration: number) {
    // Trigger focus session
    chrome.runtime.sendMessage({
      type: 'START_FOCUS',
      duration
    });
  }

  private async getCompletedTasksToday(): Promise<number> {
    const result = await chrome.storage.local.get(['dailyTasks']);
    const tasks = result.dailyTasks || [];
    return tasks.filter((t: any) => t.completed).length;
  }

  private async openDailyReview() {
    chrome.runtime.sendMessage({ type: 'SWITCH_TAB', tab: 'home' });
  }
}

export default new MCPService();

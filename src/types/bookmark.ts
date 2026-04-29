export type EnergyLevel = 'low' | 'medium' | 'high';

export interface SmartBookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  favicon?: string;
  note?: string;
  notes?: string;
  whySaved?: string;
  mood?: string;
  energy?: EnergyLevel;
  nextAction?: string;
  lastOpenedAt?: string;
  lastResurfacedAt?: string;
  sourceTabTitle?: string;
  sourceDomain?: string;
}

export interface BookmarkInput {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  note?: string;
  whySaved?: string;
  mood?: string;
  energy?: EnergyLevel;
  nextAction?: string;
  sourceTabTitle?: string;
}

export interface SaveBookmarkResult {
  bookmark: SmartBookmark;
  created: boolean;
}

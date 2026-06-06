export type MemoryLevel = 0 | 1 | 2 | 3 | 4;

export interface Deck {
  id: number;
  name: string;
  created_at: string;
  word_count?: number;
}

export interface Word {
  id: number;
  deck_id: number;
  question: string;
  answer: string;
  reading: string;
  level: MemoryLevel;
  created_at: string;
}

export type RootStackParamList = {
  Decks: undefined;
  DeckDetail: { deckId: number; deckName: string };
  WordForm: { deckId: number; wordId?: number };
  Listen: { deckId: number; deckName: string };
  Settings: undefined;
};

export const LEVEL_LABELS: Record<MemoryLevel, string> = {
  0: '未学習',
  1: '難しい',
  2: 'まあまあ',
  3: '覚えた',
  4: '完璧',
};

export const LEVEL_COLORS: Record<MemoryLevel, string> = {
  0: '#9CA3AF',
  1: '#EF4444',
  2: '#F59E0B',
  3: '#10B981',
  4: '#3B82F6',
};

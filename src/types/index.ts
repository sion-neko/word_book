export type MemoryLevel = 0 | 1 | 2 | 3 | 4;

export interface Deck {
  id: number;
  name: string;
  color: string;
  created_at: string;
  word_count?: number;
}

export interface Word {
  id: number;
  deck_id: number;
  question: string;
  answer: string;
  reading: string;
  lang: 'ja-JP' | 'en-US';
  level: MemoryLevel;
  created_at: string;
}

export interface WeakWord extends Word {
  deck_name: string;
  deck_color: string;
}

export type RootStackParamList = {
  Home: undefined;
  Folder: { deckId: number; deckName: string };
  EditCard: { deckId: number; deckName: string; word?: Word };
  Study: { words: Word[]; title: string };
  AudioMode: { words: Word[]; title: string };
  Settings: undefined;
};

export const LEVEL_LABELS: Record<MemoryLevel, string> = {
  0: '未学習',
  1: '難しい',
  2: 'まあまあ',
  3: '覚えた',
  4: '完璧',
};

// 5段階のグラデーション(苦手→完璧)。デザインの mastery scale の配色をそのまま採用。
export const LEVEL_COLORS: Record<MemoryLevel, string> = {
  0: '#C8553D',
  1: '#CB7E3D',
  2: '#CC9A3B',
  3: '#8AA055',
  4: '#5E9C6B',
};

export const ALL_LEVELS: MemoryLevel[] = [0, 1, 2, 3, 4];
export const TOP_LEVEL: MemoryLevel = 4;

// 「苦手」= 未学習・難しい。Home の復習ショートカット/Folderの苦手バッジ/Study結果の再挑戦で共通利用。
export function isWeak(level: MemoryLevel): boolean {
  return level <= 1;
}

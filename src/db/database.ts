import * as SQLite from 'expo-sqlite';
import { Deck, MemoryLevel, Pronunciation, Word, WeakWord } from '../types';

const db = SQLite.openDatabaseSync('wordbook.db');

export const FOLDER_COLORS = ['#5B63D3', '#2F9E8F', '#C2714F', '#9B5FB8', '#C8553D', '#3B82B8'];

function columnExists(table: string, column: string): boolean {
  const rows = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

export function initDatabase(): void {
  db.execSync(`PRAGMA foreign_keys = ON`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '${FOLDER_COLORS[0]}',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      reading TEXT DEFAULT '',
      answer_reading TEXT DEFAULT '',
      lang TEXT DEFAULT 'ja-JP',
      level INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS pronunciations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE,
      reading TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 既存インストール(色/言語カラムが無い版)向けのマイグレーション
  if (!columnExists('decks', 'color')) {
    db.execSync(`ALTER TABLE decks ADD COLUMN color TEXT DEFAULT '${FOLDER_COLORS[0]}'`);
  }
  if (!columnExists('words', 'lang')) {
    db.execSync(`ALTER TABLE words ADD COLUMN lang TEXT DEFAULT 'ja-JP'`);
  }
  if (!columnExists('words', 'answer_reading')) {
    db.execSync(`ALTER TABLE words ADD COLUMN answer_reading TEXT DEFAULT ''`);
  }

  db.execSync(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('playback_speed', '1.0'),
      ('pause_between_qa', '1.5'),
      ('pause_between_words', '2.0'),
      ('dark_mode', '0'),
      ('accent_color', '${FOLDER_COLORS[0]}')
  `);
}

// Deck operations

export function getDecks(): Deck[] {
  return db.getAllSync<Deck>(`
    SELECT d.id, d.name, d.color, d.created_at, COUNT(w.id) as word_count
    FROM decks d
    LEFT JOIN words w ON w.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `);
}

export function getDeck(id: number): Deck | null {
  return db.getFirstSync<Deck>('SELECT * FROM decks WHERE id = ?', [id]) ?? null;
}

export function createDeck(name: string, color: string = FOLDER_COLORS[0]): number {
  const result = db.runSync('INSERT INTO decks (name, color) VALUES (?, ?)', [name, color]);
  return result.lastInsertRowId;
}

export function updateDeck(id: number, name: string, color: string): void {
  db.runSync('UPDATE decks SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

export function deleteDeck(id: number): void {
  db.runSync('DELETE FROM decks WHERE id = ?', [id]);
}

// Word operations

export function getWords(deckId: number): Word[] {
  return db.getAllSync<Word>(
    'SELECT * FROM words WHERE deck_id = ? ORDER BY created_at ASC',
    [deckId]
  );
}

export function getWordsByLevels(deckId: number, levels: MemoryLevel[]): Word[] {
  if (levels.length === 0) return getWords(deckId);
  const placeholders = levels.map(() => '?').join(',');
  return db.getAllSync<Word>(
    `SELECT * FROM words WHERE deck_id = ? AND level IN (${placeholders}) ORDER BY created_at ASC`,
    [deckId, ...levels]
  );
}

export function getWord(id: number): Word | null {
  return db.getFirstSync<Word>('SELECT * FROM words WHERE id = ?', [id]) ?? null;
}

export function createWord(
  deckId: number,
  question: string,
  answer: string,
  reading: string = '',
  lang: string = 'ja-JP',
  level: MemoryLevel = 0,
  answerReading: string = ''
): number {
  const result = db.runSync(
    'INSERT INTO words (deck_id, question, answer, reading, answer_reading, lang, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [deckId, question, answer, reading, answerReading, lang, level]
  );
  return result.lastInsertRowId;
}

export function updateWord(
  id: number,
  question: string,
  answer: string,
  reading: string,
  lang: string = 'ja-JP',
  level: MemoryLevel = 0,
  answerReading: string = ''
): void {
  db.runSync(
    'UPDATE words SET question = ?, answer = ?, reading = ?, answer_reading = ?, lang = ?, level = ? WHERE id = ?',
    [question, answer, reading, answerReading, lang, level, id]
  );
}

export function updateWordLevel(id: number, level: MemoryLevel): void {
  db.runSync('UPDATE words SET level = ? WHERE id = ?', [level, id]);
}

export function deleteWord(id: number): void {
  db.runSync('DELETE FROM words WHERE id = ?', [id]);
}

export function bulkDeleteWords(ids: number[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  db.runSync(`DELETE FROM words WHERE id IN (${placeholders})`, ids);
}

export function bulkUpdateWordLevel(ids: number[], level: MemoryLevel): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  db.runSync(`UPDATE words SET level = ? WHERE id IN (${placeholders})`, [level, ...ids]);
}

export function bulkCreateWords(
  deckId: number,
  entries: Array<{ question: string; answer: string; reading?: string; answerReading?: string }>
): number {
  let count = 0;
  db.withTransactionSync(() => {
    for (const e of entries) {
      db.runSync(
        'INSERT INTO words (deck_id, question, answer, reading, answer_reading) VALUES (?, ?, ?, ?, ?)',
        [deckId, e.question, e.answer, e.reading ?? '', e.answerReading ?? '']
      );
      count++;
    }
  });
  return count;
}

// 全デッキ横断で「苦手」(未学習・難しい)な単語を取得 — Home の復習ショートカット用
export function getWeakWords(): WeakWord[] {
  return db.getAllSync<WeakWord>(`
    SELECT w.*, d.name as deck_name, d.color as deck_color
    FROM words w
    JOIN decks d ON d.id = w.deck_id
    WHERE w.level <= 1
    ORDER BY w.created_at ASC
  `);
}

// Settings operations

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

// Pronunciation dictionary operations — 読み上げ時の単語単位の読み方置換に使う

export function getPronunciations(): Pronunciation[] {
  // 長い用語ほど先に置換されるよう文字数の降順で返す(部分一致による誤置換を避けるため)
  return db.getAllSync<Pronunciation>(
    'SELECT * FROM pronunciations ORDER BY LENGTH(term) DESC, term ASC'
  );
}

export function addPronunciation(term: string, reading: string): number {
  const result = db.runSync(
    'INSERT INTO pronunciations (term, reading) VALUES (?, ?)',
    [term, reading]
  );
  return result.lastInsertRowId;
}

export function updatePronunciation(id: number, term: string, reading: string): void {
  db.runSync('UPDATE pronunciations SET term = ?, reading = ? WHERE id = ?', [term, reading, id]);
}

export function deletePronunciation(id: number): void {
  db.runSync('DELETE FROM pronunciations WHERE id = ?', [id]);
}

import * as SQLite from 'expo-sqlite';
import { Deck, MemoryLevel, Word } from '../types';

const db = SQLite.openDatabaseSync('wordbook.db');

export function initDatabase(): void {
  db.execSync(`PRAGMA foreign_keys = ON`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
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
    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('playback_speed', '1.0'),
      ('pause_between_qa', '1.5'),
      ('pause_between_words', '2.0')
  `);
}

// Deck operations

export function getDecks(): Deck[] {
  return db.getAllSync<Deck>(`
    SELECT d.id, d.name, d.created_at, COUNT(w.id) as word_count
    FROM decks d
    LEFT JOIN words w ON w.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `);
}

export function getDeck(id: number): Deck | null {
  return db.getFirstSync<Deck>('SELECT * FROM decks WHERE id = ?', [id]) ?? null;
}

export function createDeck(name: string): number {
  const result = db.runSync('INSERT INTO decks (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export function updateDeck(id: number, name: string): void {
  db.runSync('UPDATE decks SET name = ? WHERE id = ?', [name, id]);
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
  reading: string = ''
): number {
  const result = db.runSync(
    'INSERT INTO words (deck_id, question, answer, reading) VALUES (?, ?, ?, ?)',
    [deckId, question, answer, reading]
  );
  return result.lastInsertRowId;
}

export function updateWord(
  id: number,
  question: string,
  answer: string,
  reading: string
): void {
  db.runSync(
    'UPDATE words SET question = ?, answer = ?, reading = ? WHERE id = ?',
    [question, answer, reading, id]
  );
}

export function updateWordLevel(id: number, level: MemoryLevel): void {
  db.runSync('UPDATE words SET level = ? WHERE id = ?', [level, id]);
}

export function deleteWord(id: number): void {
  db.runSync('DELETE FROM words WHERE id = ?', [id]);
}

export function bulkCreateWords(
  deckId: number,
  entries: Array<{ question: string; answer: string; reading?: string }>
): number {
  let count = 0;
  db.withTransactionSync(() => {
    for (const e of entries) {
      db.runSync(
        'INSERT INTO words (deck_id, question, answer, reading) VALUES (?, ?, ?, ?)',
        [deckId, e.question, e.answer, e.reading ?? '']
      );
      count++;
    }
  });
  return count;
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

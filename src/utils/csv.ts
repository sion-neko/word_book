import * as DocumentPicker from 'expo-document-picker';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export interface CSVWord {
  question: string;
  answer: string;
  reading: string;
}

export async function pickAndParseCSV(): Promise<CSVWord[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const uri = result.assets[0].uri;
  const response = await fetch(uri);
  const content = await response.text();

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const words: CSVWord[] = [];

  for (const line of lines) {
    const parts = parseCSVLine(line);
    const question = parts[0] ?? '';
    const answer = parts[1] ?? '';
    const reading = parts[2] ?? '';

    if (question && answer) {
      words.push({ question, answer, reading });
    }
  }

  return words;
}

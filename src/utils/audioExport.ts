import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import SpeechExport, { SpeechExportSegment } from 'speech-export';
import { getSetting } from '../db/database';
import { Word } from '../types';
import { prepareUtterance } from './tts';

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'wordbook';
}

// デッキの問題/答えを設定中のポーズ秒数を反映しながら1本の音声ファイルに書き出し、共有シートを開く
export async function exportDeckAudio(deckName: string, words: Word[]): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('音声の書き出しはiOSのみ対応しています');
  }
  if (words.length === 0) {
    throw new Error('書き出せる問題がありません');
  }

  const rate = parseFloat(getSetting('playback_speed') ?? '1.0');
  const pauseQA = parseFloat(getSetting('pause_between_qa') ?? '1.5');
  const pauseWords = parseFloat(getSetting('pause_between_words') ?? '2.0');

  const segments: SpeechExportSegment[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isLast = i === words.length - 1;

    const question = await prepareUtterance(word.reading?.trim() || word.question);
    segments.push({
      text: question.text,
      language: question.language,
      voiceIdentifier: question.voice,
      rate,
      pauseAfterMs: pauseQA * 1000,
    });

    const answer = await prepareUtterance(word.answer_reading?.trim() || word.answer);
    segments.push({
      text: answer.text,
      language: answer.language,
      voiceIdentifier: answer.voice,
      rate,
      pauseAfterMs: isLast ? 0 : pauseWords * 1000,
    });
  }

  const fileUri = await SpeechExport.exportToFile(segments, sanitizeFileName(deckName));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  }
}

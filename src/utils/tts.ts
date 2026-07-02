import * as Speech from 'expo-speech';
import { getPronunciations } from '../db/database';

const ASCII_TERM = /^[A-Za-z0-9]+$/;
// ひらがな・カタカナ・漢字を含むかどうかで日本語/英語を判定する
const JAPANESE_CHARS = /[぀-ヿ㐀-鿿]/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectLanguage(text: string): 'ja-JP' | 'en-US' {
  return JAPANESE_CHARS.test(text) ? 'ja-JP' : 'en-US';
}

// 読み方辞書に登録された用語をすべて登録済みの読みに置換する(getPronunciationsは用語の長い順に並ぶ)
function applyPronunciationDict(text: string): string {
  const entries = getPronunciations();
  return entries.reduce((result, { term, reading }) => {
    if (!term) return result;
    // 英数字のみの用語は単語境界(\b)で囲んで、他の単語の一部を誤って置換しないようにする
    if (ASCII_TERM.test(term)) {
      return result.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g'), reading);
    }
    return result.split(term).join(reading);
  }, text);
}

let voicesPromise: Promise<Speech.Voice[]> | null = null;

function loadVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) {
    voicesPromise = Speech.getAvailableVoicesAsync().catch(() => []);
  }
  return voicesPromise;
}

// 同じ言語の音声のうちEnhanced品質があれば優先して使う(Defaultは機械的で聞き取りづらいため)
async function pickVoice(language: string): Promise<string | undefined> {
  const voices = await loadVoices();
  const base = language.split('-')[0];
  const candidates = voices.filter(
    (v) => v.language === language || v.language?.split('-')[0] === base
  );
  const enhanced = candidates.find((v) => v.quality === Speech.VoiceQuality.Enhanced);
  return (enhanced ?? candidates[0])?.identifier;
}

export async function speakText(text: string, rate: number = 1.0): Promise<void> {
  const spoken = applyPronunciationDict(text);
  const language = detectLanguage(spoken);
  const voice = await pickVoice(language);
  return new Promise((resolve) => {
    Speech.speak(spoken, {
      language,
      voice,
      rate,
      onDone: resolve,
      onError: () => resolve(),
      onStopped: () => resolve(),
    });
  });
}

export async function stopSpeech(): Promise<void> {
  await Speech.stop();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

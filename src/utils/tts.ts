import * as Speech from 'expo-speech';

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

export async function speakText(
  text: string,
  rate: number = 1.0,
  language: string = 'ja-JP'
): Promise<void> {
  const voice = await pickVoice(language);
  return new Promise((resolve) => {
    Speech.speak(text, {
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

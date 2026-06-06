import * as Speech from 'expo-speech';

export function speakText(text: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
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

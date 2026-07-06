import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type SpeechExportSegment = {
  text: string;
  language: string;
  voiceIdentifier?: string;
  rate: number;
  pauseAfterMs: number;
};

type SpeechExportNativeModule = {
  exportToFile(segments: SpeechExportSegment[], fileName: string): Promise<string>;
};

// このネイティブモジュールはiOSのみ実装されているため(expo-module.config.jsonのplatforms参照)、
// 他プラットフォームでrequireNativeModuleを呼ぶと即座にエラーになる
export default Platform.OS === 'ios'
  ? requireNativeModule<SpeechExportNativeModule>('SpeechExport')
  : (null as unknown as SpeechExportNativeModule);

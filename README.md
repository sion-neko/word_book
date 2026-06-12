# word_book

Expo (React Native) 製の単語帳アプリです。

## 必要な環境

- Node.js 18 以上
- npm または yarn
- [Expo Go](https://expo.dev/go)（実機での動作確認用）

## セットアップ

```bash
npm install
```

## 起動

```bash
npm start
```

起動後、ターミナルに表示される QR コードを Expo Go アプリで読み込むと実機で動作確認できます。

## プラットフォーム別起動

```bash
# Android エミュレーター
npm run android

# iOS シミュレーター（Mac のみ）
npm run ios

# ブラウザ
npm run web
```

## 技術スタック

- Expo SDK 54
- React Native 0.81
- expo-sqlite（ローカル DB）
- expo-speech（TTS 読み上げ）
- React Navigation（画面遷移）

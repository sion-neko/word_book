---
name: android-emulator-verify
description: このExpoアプリをAndroidエミュレーターで起動し、スクリーンショット撮影・UI操作・表示確認まで自律的に行う。実装後の動作検証に使う。
version: 1.0.0
---

# Android エミュレーターで Expo アプリを検証する

このプロジェクト固有の環境情報:

| 項目 | 値 |
|------|-----|
| ADB | `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe` |
| Emulator | `$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe` |
| AVD名 | `Medium_Phone_API_36.1` |
| デバイスID | `emulator-5554` |
| Expoポート | `8082`（8081はスマホ用Expoが占有している場合があるため） |
| アプリURL | `exp://localhost:8082` |
| 画面解像度 | `1080x2400` |

## 重要な原則

- **すべてのadbコマンドはPowerShellで実行する。** BashはWindowsで `/sdcard/` を Git のパスと誤解釈し失敗する。
- **タップ座標は必ず `uiautomator dump` で取得する。** スクリーンショット画像の目視推測は禁止（表示サイズと実座標が異なるため必ずずれる）。特にフリップカードのような画面の大部分を覆う要素がある画面では、目視推測でボタンを狙ったつもりが実はカード領域内に着地し、意図と異なる操作（カードのタップ＝フリップ切り替え等）を誘発することがある。
- **`input tap` の直後に `screencap` すると、再描画が間に合わず更新前の画面を撮ってしまうことがある。** タップの効果を確認するスクリーンショットは、タップ後に最低200〜300ms待ってから撮る（`Start-Sleep -Milliseconds 300` 等）。待たずに撮って「反応していない」と誤判定しないこと。
- **スクリーンショットは「エミュレーター内に保存→pull」の2ステップで取る。** `exec-out screencap -p | Set-Content` はWindowsでバイナリが壊れる。

---

## STEP 1: エミュレーターが起動しているか確認・起動

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$devices = & $adb devices
```

出力に `emulator-5554  device` がなければ起動する:

```powershell
$emulator = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
Start-Process $emulator -ArgumentList "-avd","Medium_Phone_API_36.1","-no-snapshot-load" -WindowStyle Hidden

# 起動完了を待つ（最大90秒）
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
for ($i = 0; $i -lt 18; $i++) {
    Start-Sleep 5
    $r = & $adb -s emulator-5554 shell getprop sys.boot_completed 2>$null
    if ($r.Trim() -eq "1") { break }
}
```

## STEP 2: Expoが起動しているか確認・起動

ポート8082でMetroが動いているか確認:

```powershell
$listening = netstat -ano | Select-String ":8082"
```

動いていなければ起動する（バックグラウンド）:

> **注意**: `Start-Process "npx" -ArgumentList ...` は `npx` が `.cmd` ファイル（バッチスクリプト）であるため `%1 is not a valid Win32 application` エラーで失敗する。必ず `cmd.exe /c` 経由で起動すること。

```powershell
$logFile = "$env:TEMP\expo_log.txt"
Start-Process "cmd.exe" `
    -ArgumentList "/c","npx expo start --android --port 8082 > `"$logFile`" 2>&1" `
    -WorkingDirectory "D:\sionf\private_develop\17_word_book" `
    -WindowStyle Hidden

# バンドル完了まで待つ
for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep 5
    $log = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
    if ($log -match "Bundled \d+ms") { break }
}
```

## STEP 3: アプリをエミュレーターに接続

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# ホストの8082をエミュレーターのlocalhost:8082に転送
& $adb -s emulator-5554 reverse tcp:8082 tcp:8082

# Expo GoでアプリURLを直接開く
& $adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "exp://localhost:8082" host.exp.exponent

# ExperienceActivityが起動するまで待つ
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep 3
    $act = & $adb -s emulator-5554 shell dumpsys activity 2>$null
    if ($act -match "ExperienceActivity") { break }
}
```

## STEP 4: スクリーンショット取得

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$out = "C:\Users\sionf\AppData\Local\Temp\claude\screen.png"  # 適宜変更

& $adb -s emulator-5554 shell screencap -p /sdcard/screen.png
& $adb -s emulator-5554 pull /sdcard/screen.png $out
```

取得後は `Read` ツールで `$out` を読み込んで内容を確認する。

## STEP 5: UI要素の座標を取得

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$xmlOut = "C:\Users\sionf\AppData\Local\Temp\claude\ui.xml"  # 適宜変更

& $adb -s emulator-5554 shell uiautomator dump /data/local/tmp/ui.xml
& $adb -s emulator-5554 pull /data/local/tmp/ui.xml $xmlOut
```

**XML の解析は必ず Bash ツールの Python で行う。** `grep` や PowerShell の `Select-String` は日本語を文字化けさせるため使用禁止。

```bash
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('C:/Users/sionf/AppData/Local/Temp/claude/ui.xml')
root = tree.getroot()
# フルスクリーンのノイズを除外して有意な要素だけ表示
SKIP = {'[0,0][1080,2400]', '[0,0][1080,200]', '[0,200][1080,2400]'}
for el in root.iter():
    text  = el.get('text', '')
    desc  = el.get('content-desc', '')
    bounds = el.get('bounds', '')
    if bounds and bounds not in SKIP:
        print(f'{text!r:30} {desc!r:30} {bounds}')
"
```

出力例:
```
'保存'                          ''                             [938,89][1043,194]
''                             '問題を追加'                      [813,89][918,194]
```

目的の要素の `bounds="[left,top][right,bottom]"` からタップ座標を計算:
```
中心X = (left + right) / 2
中心Y = (top + bottom) / 2
```
例: `bounds="[938,89][1043,194]"` → タップ座標は `(990, 141)`

## STEP 6: タップ・テキスト入力・その他の操作

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# タップ（座標はSTEP5で取得した値）
& $adb -s emulator-5554 shell input tap 990 141
# 効果を確認する場合はスクリーンショット前に一呼吸置く
# Start-Sleep -Milliseconds 300

# テキスト入力（日本語不可。英数字のみ）
& $adb -s emulator-5554 shell input text "sample text"

# 戻るキー
& $adb -s emulator-5554 shell input keyevent 4

# Enterキー
& $adb -s emulator-5554 shell input keyevent 66

# スワイプ（上にスクロール）
& $adb -s emulator-5554 shell input swipe 540 1200 540 400 300
```

> **日本語入力**: `input text` は日本語非対応。日本語テキストが必要な場合はclipboardへのコピー+ペーストを使うか、テスト内容を英数字に限定する。

## STEP 7: Expo Goのホーム画面に戻ってしまった場合の復帰

`monkey` コマンドや誤タップでExpo Goのホーム画面（HomeActivity）に戻った場合:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb -s emulator-5554 reverse tcp:8082 tcp:8082
& $adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "exp://localhost:8082" host.exp.exponent
```

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| `adb not found` | フルパス `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe` を使う |
| `Start-Process "npx" ...` が `%1 is not a valid Win32 application` で失敗 | `npx` は `.cmd` なので直接実行できない。`Start-Process "cmd.exe" -ArgumentList "/c","npx ..."` の形にする |
| ポート8081が使用中 | `--port 8082` を使う（スマホ向けExpoが8081を占有している） |
| タップが反応しない（ように見える） | まず`uiautomator dump`で座標を再確認。座標が正しいのに反応がない場合は、タップ直後すぐスクリーンショットを撮っていないか疑う（再描画が間に合わずstaleな画面を撮っている可能性がある）。200〜300ms待って撮り直す |
| Expo GoのLogin画面が出た | STEP7の手順でam startで直接URLを開く |
| スクリーンショットが壊れる | `exec-out \| Set-Content` は使わず、`screencap -p /sdcard/X.png` + `pull` の2段階にする |
| uiautomator dumpでエラー | `/data/local/tmp/ui.xml` を使う（`/sdcard/` だとBashがパスを誤解釈する） |
| XML解析で日本語が文字化け | `grep` / `Select-String` は禁止。STEP5の Python スクリプトを使う |
| ソフトキーボードが表示されない | エミュレーターはハードウェアキーボードがあるとデフォルトでソフトキーボードを出さない。`& $adb -s emulator-5554 shell settings put secure show_ime_with_hard_keyboard 1` を実行してから入力フィールドをタップする |
| 特定の画面が開けない | STEP5でトップ画面から遷移先ボタンのboundsを取得し、STEP6のtapで順番に画面遷移する |

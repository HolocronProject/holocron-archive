# Holocron Archive Ver0.5

スター・ウォーズ映像作品の完全時系列を、JSONから表示する静的Webサイトです。

## 起動方法

VS Codeでフォルダを開き、`index.html`をLive Serverで起動してください。

## 主なファイル

- `assets/data/timeline.json` — 作品単位の完全時系列
- `assets/data/clone-wars.json` — クローン・ウォーズ劇場版＋全133話
- `pages/timeline.html` — 時系列ページ
- `assets/js/timeline.js` — JSON読込・検索・絞り込み・展開
- `assets/css/style.css` — 共通デザイン

## 更新方法

JSON内の `items` 配列へレコードを追加・修正します。画面側のHTMLを変更する必要はありません。

## 注意

ブラウザでHTMLファイルを直接ダブルクリックすると、JSONの読込がブロックされる場合があります。
必ずLive ServerまたはWebサーバー経由で開いてください。

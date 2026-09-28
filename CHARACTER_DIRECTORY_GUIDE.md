# キャラクター一覧の更新方法

人物は画像の完成を待たず、名前・短い説明・公式資料へのリンクから登録する。

- 画像付きのクローン：`data/clone-characters.json`。画像は `assets/characters/<id>.png`。
- 画像制作前のクローン：`data/clone-candidates.json`。完成後は候補から削除し、画像付き一覧へ移す。
- ジェダイと元ジェダイ：`data/jedi-characters.json`。主な活動時代のグループへ登録する。
- それ以外の人物：`data/character-index.json`。`name`、`detail`、`category`、`era`、`source` を必ず記入する。

`characters.js` が4つのJSONを読み、重複させずに「人物を探す」へまとめる。`category` は主な立場、`era` は主な活動時代を1つ選ぶ。複数の勢力・時代に関わる人物も、ここでは主な入口を1つに絞る。将来、複数タグが必要になった時点でスキーマを拡張する。

追加時は、公式Databankまたは公式エピソード資料で人物名と説明を確認する。識別番号・階級・種族など、確認できない情報は書かない。画像を掲載する際は、人物の特徴を確認し、AI生成画像を公式画像と誤認させない。

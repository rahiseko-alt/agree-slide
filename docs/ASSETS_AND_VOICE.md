# イラストと音声制作の記録

## イラスト

初期ストックはPablo StanleyのOpen Doodles。公式サイト `https://www.opendoodles.com/` がCC0へのリンクと商用・個人利用可能の表記を掲載していることを確認し、公式ページが案内する配布URLから完成品PNGを取得した。取得日: 2026-10-03。

- ライセンス: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/
- 5点: reading、sitting-reading、sitting、strolling、coffee。
- ファイル別の出典・作者・ダウンロードURL・タグ: `public/illustrations/catalog.json`。
- 同梱したライセンス記録: `public/illustrations/LICENSE.md`。

ストックはこのアプリの制作に再利用する。新しいサイトは利用条件を確認して許可元へ追加する。エージェントが人物・場面をSVGで自作することは禁止。

## 音声制作ツール

`scripts/narration.py` は、制作時だけ使う任意のコマンド。ブラウザアプリは依存しない。

| ツール／方式 | 扱い |
| --- | --- |
| edge-tts 7.2.8 | 既定の任意制作ツール。LGPLv3、一部MIT。改変・同梱せず、pipから個別に導入。元の通知文を `docs/licenses/edge-tts@7.2.8-LICENSE.txt` に保存 |
| edge-tts upstream | https://github.com/rany2/edge-tts |
| Edgeオンライン音声 | 非公式接続方式。サービスの提供条件・変更の影響を受ける。音声原稿を送信する。再生時には接続しない |
| OpenAI Speech API | `--provider openai` で選べる正式API。有料。制作者のローカル環境のAPIキーだけを使用 |
| 既存MP3 | `narration.audio` で指定可能。外部サービスなしで再生できる |

サンプルは契約前説明の制作例を4言語で読み上げた20ファイル。プロバイダー・声・読み上げ原稿のハッシュ・速度を `public/audio/catalog.json` に記録する。これらは契約条件の原本や契約の成立記録ではない。

npmの本番依存ライブラリは別途 `docs/THIRD_PARTY_LICENSES.md` に記録している。アプリのMITライセンスと、外部イラスト・制作ツールの利用条件はそれぞれに従う。

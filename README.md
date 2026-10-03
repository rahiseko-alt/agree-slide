# Agree Slide

React / Vite + Spectacle + Framer Motion + i18next で作る、素材差し替え式の多言語説明スライドアプリです。5枚のサンプルで、土台の動作を確認できます。

契約時の説明やオリエンテーションで利用し、内容の理解から契約書・関連資料の確認、電子契約への案内までをつなぐことを想定しています。目的・利用場面・契約書との関係は [サービス概要](docs/PRODUCT_OVERVIEW.md) を参照してください。

開発用の段取りは [開発テンプレートの使い方](docs/DEVELOPMENT_WORKFLOW.md) を参照してください。アプリ内の表示名は現在、開発時の仮称 Interactive Guide を使用しています。

## 起動

Node.js 24 以上を使用してください。

```bash
npm ci
npm run dev
```

`http://localhost:5173` を開きます。トップの「説明をはじめる」でサンプルを開始。「素材を入れる」で実際の素材を投入できます。

## 素材を入れて動かす

### PDF・画像から

1. 「素材を入れる」を開く。
2. PDF 1点、または PNG / JPEG / WebP を選ぶ。合計30 MB、最大60枚。
3. PDFはページごとに画像化。画像はファイル名の数字順（2 → 10）でスライド化。
4. 自動で先頭のスライドへ移動。前後移動・目次・スワイプ・拡大が使える。

PowerPointはまずPDFへ書き出してください。画像に含まれる文字はそのまま表示され、言語変更では翻訳されません。要素ごとのアニメーション・翻訳・ボタンを付けるときは、次のデータ形式に置き換えます。参考動画・元スライドをCodexに渡して、この形式へ展開できる土台です。自動翻訳APIや動画解析は組み込んでいません。

### 文章・翻訳・動きを含むJSONから

`public/templates/guide.bundle.json` が動作する完全な見本です。「設定JSONを書き出す」でも現在のガイドを保存できます。

```json
{
  "version": 1,
  "guide": {
    "id": "my-guide",
    "titleKey": "guide.title",
    "descriptionKey": "guide.description",
    "slides": [
      {
        "id": "first",
        "layout": "intro",
        "titleKey": "first.title",
        "bodyKey": "first.body",
        "icon": "file",
        "animation": "slide",
        "staggerMs": 180,
        "action": { "type": "documents", "labelKey": "first.action" }
      }
    ],
    "documents": [
      {
        "id": "application",
        "titleKey": "document.title",
        "descriptionKey": "document.body",
        "kind": "pdf",
        "href": "./documents/application.pdf"
      }
    ]
  },
  "locales": {
    "ja": {
      "languageName": "日本語",
      "guide.title": "ご案内",
      "guide.description": "必要な情報を確認しましょう。",
      "first.title": "最初に確認すること",
      "first.body": "ここに説明を入れます。",
      "first.action": "必要書類を見る",
      "document.title": "申請書",
      "document.body": "記入前に内容を確認してください。"
    },
    "en": {
      "languageName": "English",
      "guide.title": "Your guide",
      "guide.description": "Check the information you need.",
      "first.title": "Before you start",
      "first.body": "Your explanation goes here.",
      "first.action": "View documents",
      "document.title": "Application form",
      "document.body": "Check the contents before filling it out."
    }
  }
}
```

書類を `public/documents/application.pdf` に配置するとリンクが動きます。上の見本を `examples/minimal.bundle.json` に用意しています。

JSONの構造、IDの重複、日本語キーの欠落、不正なURLは読み込み時とビルド時に検査します。未翻訳の文章は日本語にフォールバックします。JSONは最大100 MBまで読み込めます。

## 配布する内容へ反映する

ブラウザから読み込んだ素材は **そのブラウザのIndexedDB内** に保存されます。サーバーへアップロードされず、URLを渡しても他の端末には反映されません。

素材を確認できたら「設定JSONを書き出す」で保存し、次のコマンドで配布用の内容へ反映します。

```bash
npm run content:publish -- /path/to/guide.bundle.json
npm run build
```

`src/content/published.bundle.json` が作られ、以降はこの内容が標準になります。通常のファイル分離方式に戻すには、このファイルを別の場所へ移動してください。

ファイル分離方式では、以下を直接編集できます。

| 変更したいもの | ファイル |
| --- | --- |
| スライド追加・順番・レイアウト・動き | `src/content/guide.json` |
| 表示文・翻訳 | `src/locales/ja.json` / `en.json` / `ne.json` / `vi.json` |
| 言語追加 | `src/locales/<言語コード>.json` を追加。`languageName` はその言語の自称 |
| PDF・画像など | `public/documents/` / `public/images/` |
| 書類名・リンク | `src/content/guide.json` の `documents` |
| 新しい図解の表示部品 | `src/components/SlideContent.tsx` |
| アニメーションのパターン | `src/components/AnimatedElement.tsx` |

公開済みbundleを使う場合は、同じ情報をbundle内の `guide` / `locales` に入れます。UI文言は共通の言語ファイルから補完されます。追加言語にUI翻訳がない場合も日本語で操作できます。

## スライドのデータ仕様

| 項目 | 設定できる値 |
| --- | --- |
| `layout` | `intro` / `steps` / `cards` / `image` / `finish` |
| `icon` | `sparkles` / `globe` / `layers` / `file` / `check` / `arrow` / `play` / `hand` / `shield` |
| `animation` | `fade` / `slide` / `scale` |
| `staggerMs` | 要素を順に表示する間隔。0〜2000ms |
| `items` | 見出しキー、本文キー、アイコンの配列。最大8要素 |
| `image` / `altKey` | 画像パスと代替テキストのキー。画像スライドでは必須 |
| `action.type: documents` | 書類一覧へ移動し、戻り先のスライドIDを保持 |
| `action.type: link` | `href` を別タブで開く。PDF、Google Drive、Docs、Forms等のHTTPS URLを利用可能 |

詳しい型・制約は `src/content/schema.ts` にあります。リンクはHTTPS、または `./documents/file.pdf` などの相対パスです。サブディレクトリ公開をする場合は `/documents/...` ではなく `./documents/...` を使ってください。

## 実装済みの操作

- 前へ・次へ、目次から任意スライドへ、最初から読む、完了画面。
- キーボードの左右キー、Home / End、スマートフォンの左右スワイプ。
- スライド位置を維持した言語切替。選択言語と最後の位置を保存。
- スライド内の要素を順に表示。アニメーション再生ボタン。OSの「視差効果を減らす」に対応。
- 書類ページから元のスライドへ復帰。書類画面を再読み込みしても戻り先を保持。
- モバイルの目次・画像拡大ダイアログ、キーボードフォーカス、読み上げ用ラベル。
- コンテンツ読み込み、ローカル保存、JSON書き出し、サンプル復帰。

経路は `/#/guide/<スライドID>`、`/#/documents?from=<スライドID>`、`/#/studio` です。HashRouterを使い、静的ホストでページ更新しても404になりません。スライドは16:9の横長です。スマートフォンは横向きでの利用を基本とし、縦向きでは回転の案内を表示します。横向きではUIをコンパクトにして前後ボタンを画面内に収めます。スライド上部のツールバーと下部のナビゲーションは共通UIです。長い説明はスライド本文をスクロールできます。

## 静的ホスティング

```bash
npm run build
npm run preview
```

`dist/` を GitHub Pages / Cloudflare Pages / Vercel / Netlify 等へ配置できます。ビルドコマンドは `npm run build`、出力ディレクトリは `dist`。Viteの `base: './'` により、GitHub Pagesなどのサブディレクトリにも対応します。バックエンド、DB、ログインは必要ありません。公開先アカウントは設定していないため、外部URLへのデプロイはまだ行っていません。

## 確認とライセンス

```bash
npm run validate
npx playwright install chromium
npm test
npm run licenses
```

Playwrightはビルド済みアプリをPC・横向きスマートフォンサイズのChromiumで確認します。実際のSafari / Edge / iOS端末の確認は別途必要です。

アプリ本体はMITです。React / Vite / Spectacle / Framer Motion / i18next はMIT、PDF.jsはApache-2.0。全本番依存の一覧と原文を `docs/THIRD_PARTY_LICENSES.md`、`docs/dependency-licenses.json`、`docs/licenses/` に記録します。配布用 `dist/` にも通知文を含めます。素材の権利は素材の提供元に従います。

SpectacleのWeb用途に必要なReact Springを `@react-spring/web` に限定し、Native / Three向けの依存を除外しています。古い推移依存の修正版は `package.json` の `overrides` に固定しています。更新時はビルド・動作テストと `npm audit` を確認してください。

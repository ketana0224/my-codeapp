# mycodeapp — Microsoft Learn Search

Microsoft Learn MCP サーバーを使って、公式ドキュメントを検索する Power Platform Code App です。
日本語の検索画面、検索中・空結果・エラー表示、記事の抜粋、公式記事へのリンクを提供します。
検索は MCP SDK で接続・ツール一覧取得後に `microsoft_docs_search` を呼び出します。
応答形式やツールの変更、通信失敗は画面に表示し、ダミー結果には置き換えません。
抜粋はプレーンテキストとして表示し、記事全文の取得・AI 回答生成は行いません。

詳細な Agent 操作と初回準備は [利用手順](利用手順.md) を参照してください。

## 開発

- Node.js 24 LTS（ローカル確認: 24.20.0）、npm（11.19.0）、Git。
- Power Apps CLI `pa`（確認版: 1.3.0）。旧 `pac code` と混在させません。
- React / TypeScript / Vite の公式 Code Apps 雛形を使用。
  取得元: `microsoft/PowerAppsCodeApps` の `templates/vite`。
- 初回は `npm ci`、通常起動は `npm run dev`（`http://localhost:3000`）。
- Power Apps ホストでの確認は、Maker が対象テナントへ対話認証した後に `pa app run` を使用します。
  CLI 表示の Local Play を同じ認証ブラウザープロファイルで開きます。ホスト上の動作は別途確認が必要です。

```powershell
npm test
npm run lint
npm run build
npm run predeploy
node --test .github\tests\customizations.test.mjs
```

`predeploy` はビルド成果物・対象環境設定の検査のみで、公開は行いません。
CI は外部 MCP に接続せず、応答解析・リンク検査・Workflow ロックと実ビルドを検証します。
実通信はブラウザーで別途検証します。MCP 接続は30秒でタイムアウトします。

## 設定と情報の取り扱い

- Repo: `ketana0224/my-codeapp`（private）、対象ブランチ: `main`、既存 Repo を再利用。
- 環境表示名（申告）: `CopilotStudio-Dev`。
- テナント ID: `655bd66a-5001-4cb3-9aad-ce54a27d5d95`。
- 環境 ID: `7a457b55-1919-ef9c-8b65-ca3c03926d14`。ソリューションは使用しません。
- 新規アプリ: `mycodeapp`。初回公開前のためアプリ ID は未設定です。
- `power.config.json` は `pa app init` で生成した非秘密のアプリ設定です。
- `.env` はローカルの非秘密セットアップ記録です。Git 除外し、CI へ転送せず、
  `VITE_*` や認証の代用にしません。トークン・パスワード・クライアントシークレットは保存しません。
- 検索語は認証不要の `https://learn.microsoft.com/api/mcp` へ送信されます。
  個人情報・機密情報を入力しないでください。アプリ側で検索履歴は保存しません。
- 外部接続は組織のネットワーク・DLP 方針の確認が必要です。公開ホストでの CORS と動作も初回公開後に確認してください。

## CI と公開ロック

- [アプリ CI](.github/workflows/codeapp-ci.yml): `main` の push / pull request と手動起動。
  `npm ci` → アプリテスト・Workflow検査 → lint → 型検査・ビルド → predeploy。
- [共通定義 CI](.github/workflows/customizations-ci.yml): 同梱カスタマイズ専用です。
  共通定義 CI の成功はアプリ CI の成功とは別です。
- [デプロイ Workflow](.github/workflows/codeapp-deploy.yml): **初期ロック中**。
  手動起動時に未準備理由を表示して失敗する診断だけです。公開コマンド・秘密参照はありません。
  push では起動せず、セットアップでは実行しません。

### 検証記録・未完了事項

2026-10-28 の初期準備時点:

| 項目 | 状態 |
| --- | --- |
| Repo・ブランチ・権限 | GitHub API で private / main と書き込み・管理権限を確認 |
| CLI 認証 | キャッシュ済みアカウントのテナント識別子が指定値と一致 |
| 環境アクセス | 指定 ID で `pa app init` 成功、設定を用いた `pa app list` の読み取り成功 |
| 環境表示名 | 利用者申告。ID と表示名の管理者側照合は未確認 |
| Code Apps 有効化・ライセンス | 利用者より「有効、ライセンスあり」の申告。管理者確認者・記録、課金確認は未確認 |
| アプリ所有者・初回公開 Maker | 未定 |
| 初回公開・アプリ ID・ホスト動作 | 未実施 |
| SP 編集権限共有・環境アクセス | 未実施。共有先は Enterprise Application オブジェクト ID |
| GitHub プラン・Environment・保護 | プラン情報を取得できず未確認。Environment名・管理者・承認者は未定、保護未検証 |
| 認証方式・秘密更新担当 | 未定。`pa` の採用版で利用できる方式を別途検証 |
| Dataverse・接続参照 | ソリューション・コネクターを使わない構成。追加時に再確認 |
| ローカル検証 | Node テスト13件、lint、型検査・本番ビルド、非公開 predeploy 検査が成功 |
| ブラウザー検証 | 本番ビルドから実 MCP 検索10件と公式リンクを確認。通信失敗・空結果は模擬応答で確認。幅390pxで横スクロールなし |

SDK が試みる任意の GET イベントストリームはサーバー側で CORS エラーになりますが、
POST の接続・ツール一覧・実検索はブラウザーで成功しました。検索結果の取得成功と、
このブラウザー診断メッセージは区別してください。
ビルドには SDK 依存由来の注釈・500 kB 超チャンクの警告がありますが、ビルドは成功しています。

ロック解除は別途承認が必要です。Maker が対話認証・初回ビルド・初回公開を行い、
アプリ ID と対象環境を照合します。その後、SP へのアプリ編集共有、環境権限、
管理者による GitHub Environment の明示作成・完全一致名・実際の保護機能の検証、
承認済み経路での認証情報登録と CLI 認証検証を完了してください。
private Repo で利用できる Environment 保護は GitHub プランに依存します。
レビュー担当者が複数いても二者承認を保証しません。
準備記録が揃ったら `gh-management-deploy` へ引き継ぎます。初期設定だけでは継続デプロイ可能ではありません。

## 同梱 Agent・Skill

- [gh-management](.github/agents/gh-management.agent.md): GitHub 管理の窓口。
- [setup Skill](.github/skills/gh-management-setup/SKILL.md): 初期準備。
- [deploy Skill](.github/skills/gh-management-deploy/SKILL.md): 準備完了後のアプリ変更・PR・CI・公開追跡。
- 共通定義版は [管理情報](.github/customizations.json) の `1.0.0`。
  配布元は `ketana0224/gh-codeapps-management-copilot`、取得元 SHA は記録なし（未確認）です。
- `/Quickstart` で初期準備を再開し、共通定義の更新は `/UpdateCustomizations` で明示的に指定版を取り込みます。
  初期設定中に配布元の main を取得したり、同梱定義を再コピーしたりしません。

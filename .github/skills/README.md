# GitHub Management Skills

この Repo に同梱する Power Platform Code Apps 用 Skill の一覧です。
Template Repo からアプリ Repo を作成・Clone し、VS Code で利用します。
全体の運用手順は [利用手順](../../利用手順.md) を参照してください。

| Skill | 使用する場面 | 主な完了条件 |
|---|---|---|
| [gh-management-setup](gh-management-setup/SKILL.md) | Clone 済み Repo の初期設定。明示依頼時のみ Repo 新規作成 | ソース・アプリ CI・初期ロック済みデプロイ Workflow の反映とアプリ CI 成功 |
| [gh-management-deploy](gh-management-deploy/SKILL.md) | 初回準備済みアプリの変更・PR・マージ・公開追跡 | 対象 SHA・公開先・CI・デプロイ結果の照合 |

## 入口

- [gh-management Agent](../agents/gh-management.agent.md): 依頼に応じて Skill を選択
- [Quickstart](../prompts/quickstart.prompt.md): Template から作成した現在の Repo を `reuse` モードで初期設定
- [UpdateCustomizations](../prompts/update-customizations.prompt.md): 指定版の共通定義だけを更新する別操作

## 配置と共通更新

各 Skill は `<skill-name>\SKILL.md` と、必要な `references` 等で構成します。
`SKILL.md` の `name` はフォルダ名と一致させ、`description` に用途と呼び出す場面を記載します。
存在しない Skill や外部カタログを同梱済みとして扱いません。

[setup の設定テンプレート](gh-management-setup/references/.env.example) は非秘密値のキー定義です。
実際の `.env` はアプリ Repo のルートへ保存し、Git 管理から除外します。
[アプリ CI の雛形](gh-management-setup/references/workflows/codeapp-ci.yml) は参照用であり、
アプリの生成・調整後に実運用の Workflow として配置します。

共通更新は [管理情報](../customizations.json) の版・取得元 SHA・管理対象パスに従います。
利用側の変更は差分確認し、フォルダ全体の置換・無断削除は行いません。
初期デプロイロックの解除や実運用 Workflow の更新は、共通 Skill 更新とは別の承認済み変更です。

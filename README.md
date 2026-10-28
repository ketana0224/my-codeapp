# gh-codeapps-management-copilot

Power Platform Code Apps 用の Agent・Skill・Prompt と CI 雛形を、GitHub Template Repository として共通配布します。
テンプレートにはアプリ本体や認証情報を含めません。

## 利用方法

準備・実行コマンド・初期設定・初回公開の前提条件・共通定義の更新方法は、[利用手順](利用手順.md) を参照してください。

- 管理者: 社内配布用 Repo を準備し、Template repository を有効にします。
- アプリ開発者: 社内テンプレートからアプリ Repo を作成・Clone し、VS Code で `/Quickstart` を実行します。

`/Quickstart` は、この README をアプリ固有の目的・機能・開発・運用手順へ書き換えます。
**[利用手順](利用手順.md) は変更せず残し、初期設定後も参照できるようにします。**
新しいアプリの README にも、利用手順へのリンクを残します。

## 同梱カスタマイズ

- [gh-management Agent](.github/agents/gh-management.agent.md): 初期設定と継続更新の窓口
- [Quickstart](.github/prompts/quickstart.prompt.md): Clone 済み Repo の初期設定
- [UpdateCustomizations](.github/prompts/update-customizations.prompt.md): 指定版の共通定義の更新
- [setup Skill](.github/skills/gh-management-setup/SKILL.md): ソース・アプリ CI・初期ロック済みデプロイ Workflow の準備
- [deploy Skill](.github/skills/gh-management-deploy/SKILL.md): 初回準備後のアプリ変更・PR・公開追跡

テンプレートからの生成は初期配布です。共通定義の変更は既存アプリ Repo に自動反映されません。
また、初期デプロイ Workflow はロック済みであり、初期設定完了だけでは実デプロイ可能になりません。

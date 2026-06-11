# Card Trade Board

カードの「ショップ」「TRADE募集」「取引履歴」を切り替えて使えるWebサイトです。

Vercel Storageは使わず、共有データはGitHubリポジトリ内の `data/cards.json` に保存します。編集するとVercelのAPIがGitHubへ書き込み、全員が同じ一覧を見られます。

## ローカル確認

```bash
npm run dev
```

ローカル確認時の仮編集パスワードは `demo-pass` です。

GitHub保存用の環境変数がない場合、ローカルでは一時データで動きます。サーバーを再起動すると編集内容は初期状態に戻ります。

## 公開に必要なもの

- GitHubリポジトリ
- Vercelプロジェクト
- GitHubのFine-grained personal access token

GitHubトークンは、対象リポジトリだけを選び、Repository permissions の `Contents` を `Read and write` にしてください。

## Vercelの環境変数

VercelのProject Settingsで、次を登録します。

```text
ADMIN_TOKEN=好きな編集パスワード
GITHUB_TOKEN=GitHubのFine-grained personal access token
GITHUB_OWNER=GitHubのユーザー名またはOrganization名
GITHUB_REPO=リポジトリ名
GITHUB_BRANCH=main
GITHUB_DATA_PATH=data/cards.json
```

`ADMIN_TOKEN` が、画面右下の「編集」ボタンで入力するパスワードになります。

`GITHUB_TOKEN` はブラウザには送られません。VercelのAPIだけが使います。

## 公開手順

1. このフォルダをGitHubリポジトリへpushします。
2. VercelでそのリポジトリをImportします。
3. Vercelの環境変数を登録します。
4. Deployします。

デプロイ後、編集ボタンから `ADMIN_TOKEN` を入力すると、追加・編集・削除ができます。保存された内容は `data/cards.json` に反映され、全員に共有されます。

## データファイル

共有データは [data/cards.json](./data/cards.json) です。

公開後に画面から編集すると、このファイルにGitHubのコミットとして保存されます。手動でJSONを編集する場合は、配列形式を保ってください。

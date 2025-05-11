# Azure Blob Uploader

Azure Blob Storageにファイルを簡単にアップロードできるデスクトップアプリケーションです。

## プロジェクトの構造

クリーンアーキテクチャに基づいたファイル構造を採用しています。

### ファイル一覧と用途

#### ルートディレクトリ

- `index.html` - メインのHTMLファイル、Reactアプリケーションのマウントポイントを提供
- `package.json` - プロジェクトの設定と依存関係
- `tsconfig.json` - TypeScriptの設定
- `webpack.config.js` - Webpackの設定ファイル
- `.gitignore` - Gitが無視するファイルの設定

#### srcディレクトリ

- `src/main.ts` - Electronのメインプロセス、アプリケーションのエントリーポイント
- `src/preload.ts` - Electronのプリロードスクリプト、レンダラープロセスとメインプロセス間の通信を可能にする
- `src/renderer.tsx` - Reactアプリケーションのエントリーポイント

#### ドメイン層 (Domain Layer)

- `src/domain/errors.ts` - アプリケーションのエラータイプを定義
- `src/domain/models.ts` - ビジネスモデルとエンティティの定義

#### アプリケーション層 (Application Layer)

- `src/application/repositories.ts` - リポジトリのインターフェースを定義
- `src/application/usecases.ts` - ユースケースを実装し、ビジネスロジックを提供

#### インフラストラクチャ層 (Infrastructure Layer)

- `src/infrastructure/mockRepositories.ts` - リポジトリのモック実装、実際の外部サービスとの連携をシミュレート

#### プレゼンテーション層 (Presentation Layer)

- `src/presentation/` - UIコンポーネントを格納するディレクトリ（今後実装予定）

## アーキテクチャの特徴

- **クリーンアーキテクチャ**: 各層が明確に分離され、依存関係が内側に向かっています
- **関数ベースの設計**: TypeScriptのクラスを利用せず、関数ベースで実装しています
- **Effect-ts**: エラーハンドリングに使用し、各関数のインターフェースを型安全に定義しています

## 開発環境のセットアップ

### 必要条件
- Node.js (v16以上)
- npm (v8以上)

### インストール手順

```bash
# 依存パッケージのインストール
npm install
```

### 開発モードでの実行

```bash
# TypeScriptのコンパイル
npm run build

# アプリケーションの起動
npm start
```

または、開発モードで実行（ファイル変更を監視）：

```bash
npm run dev
```

## GitHub Actionsによるビルド

このプロジェクトではGitHub Actionsを使用して、macOS用のDMGファイルを自動的にビルドする設定が含まれています。

### ワークフローの概要

`.github/workflows/build.yml`ファイルには、以下の処理を行うワークフローが定義されています：

- macOS環境でのビルド
- 依存パッケージのインストール
- アプリケーションのビルド
- コード署名と公証（ノータリゼーション）
- DMGファイルの生成
- ビルド成果物のアップロード

### コード署名の設定

コード署名と公証を行うには、以下のGitHubシークレットを設定する必要があります：

- `MACOS_CERTIFICATE`: Base64エンコードされた.p12証明書ファイル
- `MACOS_CERTIFICATE_PWD`: 証明書のパスワード
- `KEYCHAIN_PASSWORD`: キーチェーンのパスワード（任意の値）
- `APPLE_ID`: Apple Developer Programのアカウントメールアドレス
- `APPLE_APP_SPECIFIC_PASSWORD`: App固有のパスワード
- `APPLE_TEAM_ID`: Apple Developer Teamの識別子

### 証明書の準備

証明書ファイルをBase64エンコードするには、以下のコマンドを使用します：

```bash
base64 -i 証明書ファイル.p12 -o certificate.txt
```

`certificate.txt`の内容をコピーして、GitHubのシークレットとして設定します。

### ワークフローの手動実行

GitHubリポジトリの「Actions」タブから、「Build」ワークフローを手動で実行することができます。

### シークレットの設定方法

GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」から、必要なシークレットを設定できます。

1. 「New repository secret」ボタンをクリックします
2. 「Name」フィールドにシークレット名（例：`MACOS_CERTIFICATE`）を入力します
3. 「Value」フィールドに値を入力します
4. 「Add secret」ボタンをクリックして保存します

各シークレットを追加するまで、上記の手順を繰り返します。シークレットは暗号化されて保存され、権限のあるワークフローでのみ使用できます。プルリクエストから派生したフォークのワークフローには、セキュリティ上の理由からシークレットは渡されません。

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

## 実装ステップ

- [x] 01. Electronアプリが起動して、ボタンを押すとHello Worldが表示される
- [x] 02. Effect-tsを使った簡単なサンプルアプリを作成
- [ ] 03. Azure Blob Storageへの接続機能の実装
- [ ] 04. ファイルアップロード機能の実装
- [ ] 05. サムネイル生成機能の実装
- [ ] 06. ファイル一覧表示機能の実装
- [ ] 07. 設定画面の実装

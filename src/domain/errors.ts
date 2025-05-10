/**
 * アプリケーションのエラータイプを定義するモジュール
 */

/**
 * リポジトリエラー
 * データアクセス層で発生するエラーを表します
 */
export class RepositoryError extends Error {
  readonly _tag = "RepositoryError";
  
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * ファイル処理エラー
 * ファイルの読み書きや処理中に発生するエラーを表します
 */
export class FileProcessingError extends Error {
  readonly _tag = "FileProcessingError";
  
  constructor(message: string) {
    super(message);
    this.name = "FileProcessingError";
  }
}

/**
 * アップロードエラー
 * Blobへのアップロード中に発生するエラーを表します
 */
export class UploadError extends Error {
  readonly _tag = "UploadError";
  
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

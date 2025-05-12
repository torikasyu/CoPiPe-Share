import { Effect } from 'effect';
import { FileInfo, UploadResult } from '../domain/models';
import { RepositoryError, UploadError } from '../domain/errors';

/**
 * ファイルアップロードリポジトリのインターフェース
 * Azure Blob Storageへのファイルアップロード処理を担当
 */
export type IFileUploadRepository = (fileInfo: FileInfo) => Effect.Effect<UploadResult, RepositoryError | UploadError>;

/**
 * ファイル履歴リポジトリのインターフェース
 * アップロード履歴の保存と取得を担当
 */
export type IFileHistoryRepository = {
  /** アップロード履歴を保存 */
  saveHistory: (result: UploadResult) => Effect.Effect<void, RepositoryError>;
  
  /** アップロード履歴を取得 */
  getHistory: () => Effect.Effect<UploadResult[], RepositoryError>;
  
  /** 特定のファイルの履歴を削除 */
  deleteHistory: (url: string) => Effect.Effect<void, RepositoryError>;
};

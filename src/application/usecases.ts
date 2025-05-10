import { Effect } from 'effect';
import { FileInfo, UploadResult } from '../domain/models';
import { FileProcessingError, RepositoryError, UploadError } from '../domain/errors';
import { IFileHistoryRepository, IFileUploadRepository } from './repositories';

/**
 * ファイルアップロードユースケース
 * ファイルをアップロードし、履歴を保存する
 */
export const uploadFileUseCase = (
  fileInfo: FileInfo,
  fileUploadRepository: IFileUploadRepository,
  fileHistoryRepository: IFileHistoryRepository
): Effect.Effect<UploadResult, RepositoryError | UploadError | FileProcessingError> => {
  return Effect.gen(function* (_) {
    try {
      // ファイルサイズのバリデーション (10MB制限)
      if (fileInfo.size > 10 * 1024 * 1024) {
        throw new FileProcessingError('ファイルサイズが10MBを超えています');
      }
      
      // ファイルをアップロード
      const uploadResult = yield* _(fileUploadRepository(fileInfo));
      
      // 履歴を保存
      yield* _(fileHistoryRepository.saveHistory(uploadResult));
      
      return uploadResult;
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof UploadError || error instanceof FileProcessingError) {
        throw error;
      } else if (error instanceof Error) {
        throw new FileProcessingError(`予期せぬエラーが発生しました: ${error.message}`);
      }
      throw new FileProcessingError('不明なエラーが発生しました');
    }
  });
};

/**
 * ファイル履歴取得ユースケース
 * アップロード履歴を取得する
 */
export const getFileHistoryUseCase = (
  fileHistoryRepository: IFileHistoryRepository
): Effect.Effect<UploadResult[], RepositoryError> => {
  return fileHistoryRepository.getHistory();
};

/**
 * ファイル削除ユースケース
 * 特定のファイルの履歴を削除する
 */
export const deleteFileUseCase = (
  url: string,
  fileHistoryRepository: IFileHistoryRepository
): Effect.Effect<void, RepositoryError> => {
  return fileHistoryRepository.deleteHistory(url);
};

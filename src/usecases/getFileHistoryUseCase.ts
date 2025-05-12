import { Effect } from 'effect';
import { UploadResult } from '../domain/models';
import { RepositoryError } from '../domain/errors';
import { IFileHistoryRepository } from '../infrastructure/types';

/**
 * ファイル履歴取得ユースケース
 * アップロード履歴を取得する
 */
export const getFileHistoryUseCase = (
  fileHistoryRepository: IFileHistoryRepository
): Effect.Effect<UploadResult[], RepositoryError> => {
  return fileHistoryRepository.getHistory();
};

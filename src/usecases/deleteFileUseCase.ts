import { Effect } from 'effect';
import { RepositoryError } from '../domain/errors';
import { IFileHistoryRepository } from '../infrastructure/types';

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

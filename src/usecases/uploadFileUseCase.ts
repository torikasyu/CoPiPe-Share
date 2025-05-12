import { Effect } from 'effect';
import * as path from 'path';
import { FileInfo, UploadResult } from '../domain/models';
import { AppConfig } from '../domain/config';
import { FileProcessingError, RepositoryError, UploadError } from '../domain/errors';
import { IFileHistoryRepository, IFileUploadRepository } from '../infrastructure/types';

/**
 * ファイルバリデーション関数
 * ファイルのサイズと形式を検証する
 */
const validateFile = (fileInfo: FileInfo, config: AppConfig): Effect.Effect<void, FileProcessingError> => {
  return Effect.try({
    try: () => {
      // ファイルサイズのバリデーション
      if (fileInfo.size > config.general.maxFileSizeBytes) {
        throw new FileProcessingError(
          `ファイルサイズが${config.general.maxFileSizeBytes / (1024 * 1024)}MBを超えています`
        );
      }
      
      // ファイル形式のバリデーション
      const extension = path.extname(fileInfo.name).toLowerCase().replace('.', '');
      const isImage = config.general.supportedImageFormats.includes(extension);
      const isDocument = config.general.supportedDocumentFormats.includes(extension);
      
      if (!isImage && !isDocument) {
        throw new FileProcessingError(`サポートされていないファイル形式です: ${extension}`);
      }
    },
    catch: (error: unknown) => {
      if (error instanceof FileProcessingError) {
        return error;
      }
      return new FileProcessingError('ファイルバリデーションエラー');
    }
  });
};

/**
 * ファイルアップロードユースケース
 * ファイルをアップロードし、履歴を保存する
 */
export const uploadFileUseCase = (
  fileInfo: FileInfo,
  config: AppConfig,
  fileUploadRepository: IFileUploadRepository,
  fileHistoryRepository: IFileHistoryRepository
): Effect.Effect<UploadResult, RepositoryError | UploadError | FileProcessingError> => {
  return Effect.gen(function* (_) {
    try {
      // ファイルバリデーション
      yield* _(validateFile(fileInfo, config));
      
      // ファイルをアップロード
      const uploadResult = yield* _(fileUploadRepository(fileInfo));
      
      // 履歴を保存
      yield* _(fileHistoryRepository.saveHistory(uploadResult));
      
      return uploadResult;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      } else if (error instanceof RepositoryError) {
        throw error;
      } else if (error instanceof UploadError) {
        throw error;
      } else if (error instanceof Error) {
        throw new FileProcessingError(`予期せぬエラーが発生しました: ${error.message}`);
      }
      throw new FileProcessingError('不明なエラーが発生しました');
    }
  });
};

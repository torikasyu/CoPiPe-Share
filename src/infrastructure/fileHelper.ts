import { Effect } from 'effect';
import * as fs from 'fs';
import * as path from 'path';
import { FileProcessingError } from '../domain/errors';
import { FileInfo } from '../domain/models';

/**
 * ファイルの内容を読み込む関数
 * @param filePath ファイルパス
 * @returns ファイルの内容（Buffer）
 */
export const readFileContent = (filePath: string): Effect.Effect<Buffer, FileProcessingError> => {
  return Effect.tryPromise({
    try: async () => {
      return fs.promises.readFile(filePath);
    },
    catch: (error: unknown) => {
      console.error('ファイルの読み込みに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new FileProcessingError(`ファイルの読み込みに失敗しました: ${errorMessage}`);
    }
  });
};

/**
 * ファイル情報を取得する関数
 * @param filePath ファイルパス
 * @returns ファイル情報
 */
export const getFileInfo = (filePath: string): Effect.Effect<FileInfo, FileProcessingError> => {
  return Effect.tryPromise({
    try: async () => {
      // ファイルの統計情報を取得
      const stats = await fs.promises.stat(filePath);
      
      // ファイル名を取得
      const fileName = path.basename(filePath);
      
      // MIMEタイプを推測
      const mimeType = getMimeType(fileName);
      
      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        mimeType,
        lastModified: stats.mtime
      };
    },
    catch: (error: unknown) => {
      console.error('ファイル情報の取得に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new FileProcessingError(`ファイル情報の取得に失敗しました: ${errorMessage}`);
    }
  });
};

/**
 * ファイル名からMIMEタイプを推測する関数
 * @param fileName ファイル名
 * @returns MIMEタイプ
 */
export const getMimeType = (fileName: string): string => {
  const extension = path.extname(fileName).toLowerCase().substring(1);
  
  // 一般的なMIMEタイプのマッピング
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

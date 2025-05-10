import { Effect } from 'effect';
import { FileInfo, UploadResult } from '../domain/models';
import { RepositoryError, UploadError } from '../domain/errors';
import { IFileHistoryRepository, IFileUploadRepository } from '../application/repositories';

/**
 * モックファイルアップロードリポジトリ
 * 実際のAzure Blob Storageへのアップロードの代わりにモックデータを返す
 */
export const mockFileUploadRepository: IFileUploadRepository = (fileInfo: FileInfo) => {
  return Effect.tryPromise({
    try: async () => {
      // 実際のアップロード処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 画像ファイルかどうかを判定
      const isImage = /\.(jpg|jpeg|png)$/i.test(fileInfo.name);
      
      // アップロード結果を生成
      const result: UploadResult = {
        fileInfo,
        url: `https://example.blob.core.windows.net/container/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileInfo.name}`,
        uploadedAt: new Date(),
      };
      
      // 画像ファイルの場合はサムネイルURLも追加
      if (isImage) {
        const fileNameWithoutExt = fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.'));
        const fileExt = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
        result.thumbnailUrl = `https://example.blob.core.windows.net/container/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileNameWithoutExt}_320${fileExt}`;
      }
      
      return result;
    },
    catch: (error) => {
      console.error('アップロードエラー:', error);
      return new UploadError('ファイルのアップロードに失敗しました');
    }
  });
};

/**
 * モックファイル履歴リポジトリ
 * ローカルストレージを使用してアップロード履歴を管理
 */
export const mockFileHistoryRepository: IFileHistoryRepository = {
  saveHistory: (result: UploadResult) => {
    return Effect.tryPromise({
      try: async () => {
        // 既存の履歴を取得
        const historyString = localStorage.getItem('uploadHistory') || '[]';
        const history: UploadResult[] = JSON.parse(historyString);
        
        // 新しい履歴を追加
        history.push({
          ...result,
          // Dateオブジェクトを文字列に変換してから保存
          uploadedAt: result.uploadedAt.toISOString(),
          fileInfo: {
            ...result.fileInfo,
            lastModified: result.fileInfo.lastModified.toISOString()
          }
        } as any);
        
        // 履歴を保存
        localStorage.setItem('uploadHistory', JSON.stringify(history));
      },
      catch: (error) => {
        console.error('履歴保存エラー:', error);
        return new RepositoryError('履歴の保存に失敗しました');
      }
    });
  },
  
  getHistory: () => {
    return Effect.tryPromise({
      try: async () => {
        // 履歴を取得
        const historyString = localStorage.getItem('uploadHistory') || '[]';
        const history: any[] = JSON.parse(historyString);
        
        // 文字列からDateオブジェクトに変換
        return history.map(item => ({
          ...item,
          uploadedAt: new Date(item.uploadedAt),
          fileInfo: {
            ...item.fileInfo,
            lastModified: new Date(item.fileInfo.lastModified)
          }
        }));
      },
      catch: (error) => {
        console.error('履歴取得エラー:', error);
        return new RepositoryError('履歴の取得に失敗しました');
      }
    });
  },
  
  deleteHistory: (url: string) => {
    return Effect.tryPromise({
      try: async () => {
        // 既存の履歴を取得
        const historyString = localStorage.getItem('uploadHistory') || '[]';
        const history: any[] = JSON.parse(historyString);
        
        // 指定されたURLの履歴を削除
        const newHistory = history.filter(item => item.url !== url);
        
        // 履歴を保存
        localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
      },
      catch: (error) => {
        console.error('履歴削除エラー:', error);
        return new RepositoryError('履歴の削除に失敗しました');
      }
    });
  }
};

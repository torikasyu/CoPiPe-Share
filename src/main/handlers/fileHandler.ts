import { IpcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイル操作関連のIPC通信ハンドラーを設定する関数
 * @param ipcMain IpcMainオブジェクト
 */
export const setupFileHandlers = (ipcMain: IpcMain): void => {
  // ファイル読み込み
  ipcMain.handle('file:read', async (_, filePath) => {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      throw error;
    }
  });
  
  // ファイル情報取得
  ipcMain.handle('file:getInfo', async (_, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath);
      const extension = path.extname(fileName).toLowerCase().substring(1);
      
      // 一般的なMIMEタイプのマッピング
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'txt': 'text/plain'
      };
      
      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        mimeType: mimeTypes[extension] || 'application/octet-stream',
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('ファイル情報取得エラー:', error);
      throw error;
    }
  });
};

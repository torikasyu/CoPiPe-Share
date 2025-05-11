import { IpcMain, clipboard, nativeImage, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * クリップボード関連のIPC通信ハンドラーを設定する関数
 * @param ipcMain IpcMainオブジェクト
 */
export const setupClipboardHandlers = (ipcMain: IpcMain): void => {
  // クリップボードから画像を取得
  ipcMain.handle('clipboard:getImage', async () => {
    try {
      // クリップボードから画像を取得
      const image = clipboard.readImage();
      
      // 画像が空でないかチェック
      if (image.isEmpty()) {
        return {
          success: false,
          error: 'クリップボードに画像がありません'
        };
      }
      
      // 一時ファイルとして保存
      const userDataPath = app.getPath('userData');
      const tempDir = path.join(userDataPath, 'temp');
      
      // 一時ディレクトリが存在しない場合は作成
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // 一意のファイル名を生成
      const fileName = `clipboard_image_${uuidv4()}.png`;
      const filePath = path.join(tempDir, fileName);
      
      // PNG形式で保存
      fs.writeFileSync(filePath, image.toPNG());
      
      // ファイル情報を返す
      const stats = fs.statSync(filePath);
      const fileInfo = {
        name: fileName,
        path: filePath,
        size: stats.size,
        mimeType: 'image/png',
        lastModified: stats.mtime
      };
      
      return {
        success: true,
        fileInfo
      };
    } catch (error) {
      console.error('クリップボード画像取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
};

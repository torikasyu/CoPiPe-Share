import { IpcMain, clipboard, nativeImage, app, globalShortcut, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * クリップボードから画像を処理し、アップロードを開始する関数
 */
const processClipboardImage = async (): Promise<void> => {
  try {
    // クリップボードから画像を取得
    const image = clipboard.readImage();
    
    // 画像が空でないかチェック
    if (image.isEmpty()) {
      console.log('クリップボードに画像がありません');
      return;
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
    
    // ファイル情報を作成
    const stats = fs.statSync(filePath);
    const fileInfo = {
      name: fileName,
      path: filePath,
      size: stats.size,
      mimeType: 'image/png',
      lastModified: stats.mtime
    };
    
    // すべての開いているウィンドウに画像ペーストイベントを送信
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('clipboard:imageProcessed', {
          success: true,
          fileInfo
        });
      }
    });
    
    console.log('クリップボード画像を処理しました:', fileName);
  } catch (error) {
    console.error('クリップボード画像処理エラー:', error);
    
    // エラーをすべてのウィンドウに送信
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('clipboard:imageProcessed', {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー'
        });
      }
    });
  }
};

/**
 * クリップボード関連のIPC通信ハンドラーとグローバルショートカットを設定する関数
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

/**
 * グローバルショートカットを設定する関数
 */
export const setupGlobalShortcuts = (): void => {
  // すべてのグローバルショートカットを削除
  globalShortcut.unregisterAll();
  
  // Cmd+V (macOS) / Ctrl+V (Windows/Linux) を登録
  const shortcut = process.platform === 'darwin' ? 'Cmd+V' : 'Ctrl+V';
  
  const registered = globalShortcut.register(shortcut, () => {
    console.log(`グローバルショートカット ${shortcut} が押されました`);
    processClipboardImage();
  });
  
  if (registered) {
    console.log(`グローバルショートカット ${shortcut} を登録しました`);
  } else {
    console.log(`グローバルショートカット ${shortcut} の登録に失敗しました`);
  }
};

/**
 * グローバルショートカットを解除する関数
 */
export const unregisterGlobalShortcuts = (): void => {
  globalShortcut.unregisterAll();
  console.log('すべてのグローバルショートカットを解除しました');
};

import { ipcMain } from 'electron';
import { setupFileHandlers } from './fileHandler';
import { setupConfigHandlers } from './configHandler';
import { setupUploadHandlers } from './uploadHandler';
import { setupClipboardHandlers } from './clipboardHandler';

/**
 * すべてのIPC通信ハンドラーを設定する関数
 */
export const setupIpcHandlers = (): void => {
  // 各モジュールのハンドラーを設定
  setupFileHandlers(ipcMain);
  setupConfigHandlers(ipcMain);
  setupUploadHandlers(ipcMain);
  setupClipboardHandlers(ipcMain);
  
  console.log('すべてのIPC通信ハンドラーが設定されました');
};

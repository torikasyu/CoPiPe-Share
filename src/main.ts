import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// メインウィンドウの参照をグローバルに保持
let mainWindow: BrowserWindow | null = null;

// IPC通信のハンドラを設定
function setupIpcHandlers() {
  // ファイル選択ダイアログを開く
  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return [];
    
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections']
    });
    
    if (canceled) return [];
    return filePaths;
  });
  
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
}

// メインウィンドウを作成する関数
const createWindow = () => {
  // ブラウザウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'), // 絶対パスで指定
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // サンドボックスを無効化してプリロードスクリプトでNode.jsモジュールを使用可能に
      devTools: true // 開発ツールを有効化
    }
  });
  
  // プリロードスクリプトのパスをログ表示
  console.log('プリロードスクリプトパス:', path.resolve(__dirname, 'preload.js'));
  
  // 開発ツールを開く（デバッグのため）
  mainWindow.webContents.openDevTools();
  
  // レンダラープロセスのエラーをキャッチ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('ページ読み込みエラー:', errorCode, errorDescription);
  });
  
  // レンダラープロセスのコンソールログをメインプロセスに表示
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`レンダラーログ [${level}]: ${message}`);
  });

  // HTMLファイルをロード
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // 開発ツールを開く（開発時のみ）
  // mainWindow.webContents.openDevTools();

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Electronの初期化が完了したらウィンドウを作成
app.whenReady().then(() => {
  // IPC通信のハンドラを設定
  setupIpcHandlers();
  
  createWindow();

  // macOSでは、ユーザがDockアイコンをクリックしたときに
  // ウィンドウがない場合は再作成する
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたときにアプリを終了（Windows & Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

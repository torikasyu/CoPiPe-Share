import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { setupIpcHandlers } from './handlers/index';

// メインウィンドウの参照をグローバルに保持
let mainWindow: BrowserWindow | null = null;

// メインウィンドウを作成する関数
const createWindow = () => {
  // ブラウザウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // 絶対パスで指定
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // サンドボックスを無効化してプリロードスクリプトでNode.jsモジュールを使用可能に
      devTools: true // 開発ツールを有効化
    }
  });
    
  // レンダラープロセスのエラーをキャッチ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('ページ読み込みエラー:', errorCode, errorDescription);
  });
  
  // HTMLファイルをロード
  mainWindow.loadFile(path.join(__dirname, '../../index.html'));

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

  // macOSでは、ユーザがDockアイコンをクリックしたときにウィンドウがない場合は再作成する
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

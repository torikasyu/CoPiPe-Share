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
  
  // プリロードスクリプトのパスをログ表示
  console.log('プリロードスクリプトパス:', path.join(__dirname, '../preload.js'));
  
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

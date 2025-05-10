import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// メインウィンドウの参照をグローバルに保持
let mainWindow: BrowserWindow | null = null;

// メインウィンドウを作成する関数
const createWindow = () => {
  // ブラウザウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // コンパイル後のファイルパス
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true // 開発ツールを有効化
    }
  });
  
  // アプリの起動時にログを表示
  console.log('プリロードスクリプトパス:', path.join(__dirname, 'preload.js'));
  
  // 開発ツールを開く（デバッグのため）
  mainWindow.webContents.openDevTools();

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

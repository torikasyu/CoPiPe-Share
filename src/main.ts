import { app, BrowserWindow, dialog, ipcMain, clipboard, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

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
  
  // 設定ファイルの読み込み
  ipcMain.handle('config:get', async () => {
    try {
      // 設定ファイルのパス
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.yaml');
      
      // 設定ファイルが存在しない場合はデフォルト設定を作成
      if (!fs.existsSync(configPath)) {
        const defaultConfig = {
          azureStorage: {
            connectionString: '',
            containerName: 'uploads',
          },
          general: {
            maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
            supportedImageFormats: ['jpg', 'jpeg', 'png'],
            supportedDocumentFormats: ['pdf'],
          },
        };
        
        // 設定ディレクトリが存在しない場合は作成
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        // デフォルト設定をYAML形式で書き込み
        const yamlContent = yaml.dump(defaultConfig, { indent: 2 });
        fs.writeFileSync(configPath, yamlContent, 'utf8');
        
        return defaultConfig;
      }
      
      // 設定ファイルを読み込み
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      
      // YAMLをパース
      const config = yaml.load(yamlContent);
      
      return config;
    } catch (error) {
      console.error('設定ファイルの読み込みに失敗しました:', error);
      throw error;
    }
  });
  
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
      
      // ファイル名を生成
      const timestamp = new Date().getTime();
      const filePath = path.join(tempDir, `clipboard_image_${timestamp}.png`);
      
      // PNG形式で保存
      fs.writeFileSync(filePath, image.toPNG());
      
      // ファイル情報を返す
      const stats = fs.statSync(filePath);
      return {
        success: true,
        fileInfo: {
          name: `clipboard_image_${timestamp}.png`,
          path: filePath,
          size: stats.size,
          mimeType: 'image/png',
          lastModified: stats.mtime
        }
      };
    } catch (error: unknown) {
      console.error('クリップボード画像取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
  
  // ファイルアップロード処理
  ipcMain.handle('file:upload', async (event, fileInfo) => {
    try {
      // 設定を読み込み
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.yaml');
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(yamlContent) as any;
      
      // 進捗情報をレンダラープロセスに送信する関数
      const sendProgress = (progress: any) => {
        if (event.sender.isDestroyed()) return;
        event.sender.send('upload:progress', progress);
      };
      
      // 接続文字列が設定されていない場合はモックを使用
      if (!config.azureStorage.connectionString) {
        console.log('モックリポジトリを使用してアップロードします');
        
        // モックの進捗表示をシミュレート
        const totalBytes = fileInfo.size;
        const steps = 10;
        
        for (let i = 1; i <= steps; i++) {
          // モックの進捗情報を送信
          const bytesTransferred = Math.floor((i / steps) * totalBytes);
          const percentage = Math.floor((i / steps) * 100);
          
          sendProgress({
            bytesTransferred,
            totalBytes,
            fileName: fileInfo.name,
            percentage
          });
          
          // 少し遅延を入れて進捗をシミュレート
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // モックリポジトリを使用してアップロード
        const mockResult: any = {
          fileInfo,
          url: `https://example.com/mock/${fileInfo.name}`,
          uploadedAt: new Date()
        };
        
        // 画像ファイルの場合はサムネイルURLも設定
        const isImage = /\.(jpg|jpeg|png)$/i.test(fileInfo.name);
        if (isImage) {
          const fileNameWithoutExt = fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.'));
          const fileExt = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
          mockResult.thumbnailUrl = `https://example.com/mock/${fileNameWithoutExt}_320${fileExt}`;
        }
        
        return {
          success: true,
          result: mockResult,
          usedMock: true
        };
      } else {
        console.log('Azure Blob Storageにアップロードします');
        
        // Azure Blob Storageにアップロード
        const { BlobServiceClient } = require('@azure/storage-blob');
        
        // BlobServiceClientの作成
        const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureStorage.connectionString);
        
        // コンテナクライアントの取得
        const containerClient = blobServiceClient.getContainerClient(config.azureStorage.containerName);
        
        // コンテナが存在しない場合は作成
        const containerExists = await containerClient.exists();
        if (!containerExists) {
          await containerClient.create();
        }
        
        // アップロード先のパスを生成（YYYY/MM/ファイル名）
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        let blobPath = `${year}/${month}/${fileInfo.name}`;
        
        // 同名ファイルが存在するかチェック
        let uniqueBlobPath = blobPath;
        let counter = 2;
        let blobClient = containerClient.getBlockBlobClient(uniqueBlobPath);
        let exists = await blobClient.exists();
        
        while (exists && counter < 100) {
          // ファイル名を分解
          const lastSlashIndex = blobPath.lastIndexOf('/');
          const directory = blobPath.substring(0, lastSlashIndex + 1);
          const fileName = blobPath.substring(lastSlashIndex + 1);
          
          // 拡張子を分離
          const lastDotIndex = fileName.lastIndexOf('.');
          const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
          const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
          
          // 連番を付与
          const newFileName = `${baseName}_${counter.toString().padStart(2, '0')}${extension}`;
          uniqueBlobPath = `${directory}${newFileName}`;
          blobClient = containerClient.getBlockBlobClient(uniqueBlobPath);
          exists = await blobClient.exists();
          counter++;
        }
        
        // ファイルを読み込み
        const fileContent = await fs.promises.readFile(fileInfo.path);
        
        // Content-Typeを設定
        const options = {
          blobHTTPHeaders: {
            blobContentType: fileInfo.mimeType
          },
          onProgress: (progress: any) => {
            // 進捗情報をレンダラープロセスに送信
            sendProgress({
              bytesTransferred: progress.loadedBytes,
              totalBytes: fileContent.length,
              fileName: fileInfo.name,
              percentage: Math.round((progress.loadedBytes / fileContent.length) * 100)
            });
          }
        };
        
        // アップロード
        blobClient = containerClient.getBlockBlobClient(uniqueBlobPath);
        await blobClient.upload(fileContent, fileContent.length, options);
        
        // 公開URLを生成
        let url = blobClient.url;
        
        // baseUrlが設定されている場合は、そちらを使用
        if (config.azureStorage.baseUrl) {
          url = `${config.azureStorage.baseUrl}/${uniqueBlobPath}`;
        }
        
        // アップロード結果を返す
        const result: {
          fileInfo: any;
          url: any;
          uploadedAt: Date;
          thumbnailUrl?: string;
        } = {
          fileInfo,
          url,
          uploadedAt: new Date()
        };
        
        // 画像ファイルの場合はサムネイルURLも設定
        const isImage = /\.(jpg|jpeg|png)$/i.test(fileInfo.name);
        if (isImage) {
          // サムネイルのパスを生成
          const fileNameWithoutExt = fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.'));
          const fileExt = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
          const thumbnailName = `${fileNameWithoutExt}_320${fileExt}`;
          const thumbnailPath = `${year}/${month}/${thumbnailName}`;
          
          // サムネイルURLを設定
          if (config.azureStorage.baseUrl) {
            result.thumbnailUrl = `${config.azureStorage.baseUrl}/${thumbnailPath}`;
          } else {
            const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailPath);
            result.thumbnailUrl = thumbnailBlobClient.url;
          }
        }
        
        return {
          success: true,
          result,
          usedMock: false
        };
      }
    } catch (error: unknown) {
      console.error('ファイルアップロードエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
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
      devTools: true, // 開発ツールを有効化
      webSecurity: true // Webセキュリティを有効化（CSPは別途設定）
    }
  });
  
  // コンテンツセキュリティポリシー（CSP）を設定
  // img-srcに'self'と'https:'を追加して外部画像の読み込みを許可
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';", 
          "script-src 'self';", 
          "img-src 'self' https: blob: data:;", // 外部画像、Blob URL、Data URLを許可
          "style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
  
  // プリロードスクリプトのパスをログ表示
  console.log('プリロードスクリプトパス:', path.resolve(__dirname, 'preload.js'));
  
  // 開発ツールを開く（デバッグのため）
  // mainWindow.webContents.openDevTools();
  
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

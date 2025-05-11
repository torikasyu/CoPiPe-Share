import { IpcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { uploadToAzureStorage, uploadToMockStorage } from '../services/storageService';
import { UploadProgressInfo } from '../../domain/models';

/**
 * アップロード関連のIPC通信ハンドラーを設定する関数
 * @param ipcMain IpcMainオブジェクト
 */
export const setupUploadHandlers = (ipcMain: IpcMain): void => {
  // ファイルアップロード
  ipcMain.handle('file:upload', async (event, fileInfo) => {
    try {
      // 設定を読み込み
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.yaml');
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(yamlContent) as any;
      
      // 進捗情報をレンダラープロセスに送信する関数
      const sendProgress = (progress: UploadProgressInfo) => {
        if (event.sender.isDestroyed()) return;
        event.sender.send('upload:progress', progress);
      };
      
      // 接続文字列が設定されていない場合はモックを使用
      if (!config.azureStorage.connectionString) {
        console.log('モックリポジトリを使用してアップロードします');
        
        // モックストレージにアップロード
        const result = await uploadToMockStorage(fileInfo, sendProgress);
        
        return {
          success: true,
          result,
          usedMock: true
        };
      } else {
        console.log('Azure Blob Storageにアップロードします');
        
        // Azure Blob Storageにアップロード
        const result = await uploadToAzureStorage(
          fileInfo,
          {
            connectionString: config.azureStorage.connectionString,
            containerName: config.azureStorage.containerName,
            baseUrl: config.azureStorage.baseUrl
          },
          sendProgress
        );
        
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
};

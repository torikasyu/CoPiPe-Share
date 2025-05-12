import { IpcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { uploadToAzureStorage, uploadToMockStorage } from '../services/storageService';
import { FileInfo, UploadProgressInfo } from '../../domain/models';
import { AppConfig } from '../../domain/config';

/**
 * ファイルバリデーション関数
 * ファイルのサイズと形式を検証する
 */
const validateFile = (fileInfo: FileInfo, config: AppConfig): { isValid: boolean; errorMessage?: string } => {
  try {
    // ファイルサイズのバリデーション
    if (fileInfo.size > config.general.maxFileSizeBytes) {
      return {
        isValid: false,
        errorMessage: `ファイルサイズが${config.general.maxFileSizeBytes / (1024 * 1024)}MBを超えています`
      };
    }
    
    // ファイル形式のバリデーション
    const extension = path.extname(fileInfo.name).toLowerCase().replace('.', '');
    const isImage = config.general.supportedImageFormats.includes(extension);
    const isDocument = config.general.supportedDocumentFormats.includes(extension);
    
    if (!isImage && !isDocument) {
      return {
        isValid: false,
        errorMessage: `サポートされていないファイル形式です: ${extension}`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('バリデーションエラー:', error);
    return {
      isValid: false,
      errorMessage: 'ファイルバリデーションエラー'
    };
  }
};

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
      const config = yaml.load(yamlContent) as AppConfig;
      
      // ファイルバリデーション
      const validation = validateFile(fileInfo, config);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errorMessage
        };
      }
      
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

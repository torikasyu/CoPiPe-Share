import { IpcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { AppConfig } from '../../domain/config';

/**
 * 設定関連のIPC通信ハンドラーを設定する関数
 * @param ipcMain IpcMainオブジェクト
 */
export const setupConfigHandlers = (ipcMain: IpcMain): void => {
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
  
  // 設定ファイルの保存
  ipcMain.handle('config:save', async (_, config: AppConfig) => {
    try {
      // 設定ファイルのパス
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.yaml');
      const configDir = path.dirname(configPath);
      
      // 設定ディレクトリが存在しない場合は作成
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // 設定をYAML形式で書き込み
      const yamlContent = yaml.dump(config, { indent: 2 });
      fs.writeFileSync(configPath, yamlContent, 'utf8');
      
      return { success: true };
    } catch (error) {
      console.error('設定ファイルの保存に失敗しました:', error);
      throw error;
    }
  });
};

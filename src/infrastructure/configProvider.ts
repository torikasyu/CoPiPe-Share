import { Effect } from 'effect';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { app } from 'electron';
import { AppConfig } from '../domain/config';
import { ConfigError } from '../domain/errors';

/**
 * 設定プロバイダーのインターフェース
 * 設定ファイルを読み込み、アプリケーション設定を提供します
 */
export type IConfigProvider = () => Effect.Effect<AppConfig, ConfigError>;

/**
 * デフォルトの設定
 */
const defaultConfig: AppConfig = {
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

/**
 * 設定ファイルのパスを取得
 */
const getConfigFilePath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.yaml');
};

/**
 * 設定ファイルが存在するかチェック
 */
const configFileExists = (): boolean => {
  try {
    return fs.existsSync(getConfigFilePath());
  } catch (error) {
    return false;
  }
};

/**
 * デフォルト設定ファイルを作成
 */
const createDefaultConfigFile = (): Effect.Effect<void, ConfigError> => {
  return Effect.tryPromise({
    try: async () => {
      const configPath = getConfigFilePath();
      const configDir = path.dirname(configPath);
      
      // 設定ディレクトリが存在しない場合は作成
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // デフォルト設定をYAML形式で書き込み
      const yamlContent = yaml.dump(defaultConfig, { indent: 2 });
      fs.writeFileSync(configPath, yamlContent, 'utf8');
    },
    catch: (error: unknown) => {
      console.error('設定ファイルの作成に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new ConfigError(`デフォルト設定ファイルの作成に失敗しました: ${errorMessage}`);
    }
  });
};

/**
 * YAML設定プロバイダー
 * YAMLファイルから設定を読み込みます
 */
export const yamlConfigProvider: IConfigProvider = () => {
  return Effect.tryPromise({
    try: async () => {
      // 設定ファイルが存在しない場合はデフォルト設定を作成
      if (!configFileExists()) {
        await Effect.runPromise(createDefaultConfigFile());
      }
      
      // 設定ファイルを読み込み
      const configPath = getConfigFilePath();
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      
      // YAMLをパース
      const config = yaml.load(yamlContent) as AppConfig;
      
      // 必須項目が欠けている場合はデフォルト値でマージ
      return {
        azureStorage: {
          ...defaultConfig.azureStorage,
          ...config.azureStorage,
        },
        general: {
          ...defaultConfig.general,
          ...config.general,
        },
      };
    },
    catch: (error: unknown) => {
      console.error('設定ファイルの読み込みに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new ConfigError(`設定ファイルの読み込みに失敗しました: ${errorMessage}`);
    }
  });
};

/**
 * 環境変数設定プロバイダー
 * 環境変数から設定を読み込みます（テスト用）
 */
export const envConfigProvider: IConfigProvider = () => {
  return Effect.tryPromise({
    try: async () => {
      return {
        azureStorage: {
          connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
          containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads',
          baseUrl: process.env.AZURE_STORAGE_BASE_URL,
        },
        general: {
          maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10),
          supportedImageFormats: (process.env.SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png').split(','),
          supportedDocumentFormats: (process.env.SUPPORTED_DOCUMENT_FORMATS || 'pdf').split(','),
        },
      };
    },
    catch: (error: unknown) => {
      console.error('環境変数の読み込みに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new ConfigError(`環境変数の読み込みに失敗しました: ${errorMessage}`);
    }
  });
};

/**
 * 設定を保存
 */
export const saveConfig = (config: AppConfig): Effect.Effect<void, ConfigError> => {
  return Effect.tryPromise({
    try: async () => {
      const configPath = getConfigFilePath();
      const yamlContent = yaml.dump(config, { indent: 2 });
      fs.writeFileSync(configPath, yamlContent, 'utf8');
    },
    catch: (error: unknown) => {
      console.error('設定の保存に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return new ConfigError(`設定の保存に失敗しました: ${errorMessage}`);
    }
  });
};

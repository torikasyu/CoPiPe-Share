/**
 * Azure Blob Storageの設定情報を表すモデル
 */
export type AzureStorageConfig = {
  /** 接続文字列 */
  connectionString: string;
  
  /** コンテナ名 */
  containerName: string;
  
  /** 公開URLのベースパス（オプション） */
  baseUrl?: string;
};

/**
 * アプリケーション設定を表すモデル
 */
export type AppConfig = {
  /** Azure Blob Storageの設定 */
  azureStorage: AzureStorageConfig;
  
  /** アプリケーションの一般設定 */
  general: {
    /** 最大ファイルサイズ（バイト） */
    maxFileSizeBytes: number;
    
    /** 対応している画像形式 */
    supportedImageFormats: string[];
    
    /** 対応しているドキュメント形式 */
    supportedDocumentFormats: string[];
  };
};

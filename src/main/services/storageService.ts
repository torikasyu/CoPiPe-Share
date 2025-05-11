import { BlobServiceClient, ContainerClient, BlockBlobUploadOptions } from '@azure/storage-blob';
import * as fs from 'fs';
import { UploadProgressInfo } from '../../domain/models';

/**
 * ストレージ設定インターフェース
 */
interface StorageConfig {
  connectionString: string;
  containerName: string;
  baseUrl?: string;
}

/**
 * アップロード結果インターフェース
 */
interface UploadResult {
  fileInfo: any;
  url: string;
  uploadedAt: Date;
  thumbnailUrl?: string;
}

/**
 * コンテナが存在することを確認し、存在しない場合は作成します
 */
const ensureContainerExists = async (containerClient: ContainerClient): Promise<void> => {
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create();
  }
};

/**
 * ファイル名にタイムスタンプを付与して一意のファイル名を生成します
 * 例: image.png -> image_20250511100142.png
 */
const ensureUniqueFileName = async (containerClient: ContainerClient, blobPath: string): Promise<string> => {
  // ファイル名を分解
  const lastSlashIndex = blobPath.lastIndexOf('/');
  const directory = blobPath.substring(0, lastSlashIndex + 1);
  const fileName = blobPath.substring(lastSlashIndex + 1);
  
  // 拡張子を分離
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  
  // 現在の日時からタイムスタンプを生成（YYYYMMDDHHmmss形式）
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getDate().toString().padStart(2, '0'),
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0')
  ].join('');
  
  // タイムスタンプを付与したファイル名を生成
  const newFileName = `${baseName}_${timestamp}${extension}`;
  const newBlobPath = `${directory}${newFileName}`;
  
  return newBlobPath;
};

/**
 * ファイルをAzure Blob Storageにアップロードします
 * @param fileInfo アップロードするファイル情報
 * @param config ストレージ設定
 * @param onProgress 進捗通知コールバック関数
 * @returns アップロード結果
 */
export const uploadToAzureStorage = async (
  fileInfo: any,
  config: StorageConfig,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<UploadResult> => {
  // BlobServiceClientの作成
  const blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
  
  // コンテナクライアントの取得
  const containerClient = blobServiceClient.getContainerClient(config.containerName);
  
  // コンテナが存在しない場合は作成
  await ensureContainerExists(containerClient);
  
  // アップロード先のパスを生成（YYYY/MM/ファイル名）
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const blobPath = `${year}/${month}/${fileInfo.name}`;
  
  // 同名ファイルが存在するかチェック
  const uniqueBlobPath = await ensureUniqueFileName(containerClient, blobPath);
  
  // ファイルをアップロード
  const blockBlobClient = containerClient.getBlockBlobClient(uniqueBlobPath);
  
  // ファイルの内容を読み込み
  const fileContent = await fs.promises.readFile(fileInfo.path);
  
  // Content-Typeを設定
  const options: BlockBlobUploadOptions = {
    blobHTTPHeaders: {
      blobContentType: fileInfo.mimeType
    },
    onProgress: onProgress ? (progress) => {
      // 進捗情報をコールバックで通知
      onProgress({
        bytesTransferred: progress.loadedBytes,
        totalBytes: fileContent.length,
        fileName: fileInfo.name,
        percentage: Math.round((progress.loadedBytes / fileContent.length) * 100)
      });
    } : undefined
  };
  
  // アップロード
  await blockBlobClient.upload(fileContent, fileContent.length, options);
  
  // 公開URLを生成
  let url = blockBlobClient.url;
  
  // baseUrlが設定されている場合は、そちらを使用
  if (config.baseUrl) {
    url = `${config.baseUrl}/${uniqueBlobPath}`;
  }
  
  // アップロード結果を作成
  const result: UploadResult = {
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
    if (config.baseUrl) {
      result.thumbnailUrl = `${config.baseUrl}/${thumbnailPath}`;
    } else {
      const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailPath);
      result.thumbnailUrl = thumbnailBlobClient.url;
    }
  }
  
  return result;
};

/**
 * モックアップロードを実行します（実際にはアップロードせず、ダミーの結果を返します）
 * @param fileInfo アップロードするファイル情報
 * @param onProgress 進捗通知コールバック関数
 * @returns アップロード結果
 */
export const uploadToMockStorage = async (
  fileInfo: any,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<UploadResult> => {
  // モックの進捗表示をシミュレート
  const totalBytes = fileInfo.size;
  const steps = 10;
  
  for (let i = 1; i <= steps; i++) {
    // モックの進捗情報を通知
    if (onProgress) {
      const bytesTransferred = Math.floor((i / steps) * totalBytes);
      const percentage = Math.floor((i / steps) * 100);
      
      onProgress({
        bytesTransferred,
        totalBytes,
        fileName: fileInfo.name,
        percentage
      });
    }
    
    // 少し遅延を入れて進捗をシミュレート
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // モックのアップロード結果を作成
  const result: UploadResult = {
    fileInfo,
    url: `https://example.com/mock/${fileInfo.name}`,
    uploadedAt: new Date()
  };
  
  // 画像ファイルの場合はサムネイルURLも設定
  const isImage = /\.(jpg|jpeg|png)$/i.test(fileInfo.name);
  if (isImage) {
    const fileNameWithoutExt = fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.'));
    const fileExt = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
    result.thumbnailUrl = `https://example.com/mock/${fileNameWithoutExt}_320${fileExt}`;
  }
  
  return result;
};

import { Effect } from 'effect';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, BlockBlobUploadOptions } from '@azure/storage-blob';
import { FileInfo, UploadResult, UploadProgressInfo } from '../domain/models';
import { RepositoryError, UploadError, FileProcessingError } from '../domain/errors';
import { IFileUploadRepository } from '../application/repositories';
import { AzureStorageConfig } from '../domain/config';
import { readFileContent } from './fileHelper';

/**
 * Azure Blob Storageリポジトリの実装
 * 実際のAzure Blob Storageにファイルをアップロードします
 * @param config Azure Storageの設定
 * @param onProgress アップロード進捗を通知するコールバック関数（オプション）
 */
export const createAzureBlobRepository = (
  config: AzureStorageConfig,
  onProgress?: (progress: UploadProgressInfo) => void
): IFileUploadRepository => {
  return (fileInfo: FileInfo) => {
    return Effect.tryPromise({
      try: async () => {
        try {
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
          
          // Content-Typeを設定
          const options = {
            blobHTTPHeaders: {
              blobContentType: fileInfo.mimeType
            }
          };
          
          // ファイルの内容を読み込み
          const fileContentEffect = readFileContent(fileInfo.path);
          const fileContent = await Effect.runPromise(fileContentEffect);
          
          // アップロードオプションを設定
          const uploadOptions: BlockBlobUploadOptions = {
            ...options,
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
          await blockBlobClient.upload(fileContent, fileContent.length, uploadOptions);
          
          // 公開URLを生成
          let url = blockBlobClient.url;
          
          // baseUrlが設定されている場合は、そちらを使用
          if (config.baseUrl) {
            url = `${config.baseUrl}/${uniqueBlobPath}`;
          }
          
          // アップロード結果を返す
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
        } catch (error: unknown) {
          console.error('Azure Blob Storageへのアップロードに失敗しました:', error);
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          throw new UploadError(`ファイルのアップロードに失敗しました: ${errorMessage}`);
        }
      },
      catch: (error: unknown) => {
        if (error instanceof UploadError) {
          return error;
        }
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        return new RepositoryError(`Azure Blob Storageリポジトリでエラーが発生しました: ${errorMessage}`);
      }
    });
  };
};

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
 * 同名ファイルが存在する場合、一意のファイル名を生成します
 * 例: image.png -> image_02.png
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
  
  // 同名ファイルが存在するかチェック
  const blobClient = containerClient.getBlobClient(blobPath);
  const exists = await blobClient.exists();
  
  if (!exists) {
    return blobPath;
  }
  
  // 同名ファイルが存在する場合、連番を付与
  let counter = 2;
  let newBlobPath: string;
  
  do {
    const newFileName = `${baseName}_${counter.toString().padStart(2, '0')}${extension}`;
    newBlobPath = `${directory}${newFileName}`;
    const newBlobClient = containerClient.getBlobClient(newBlobPath);
    const newExists = await newBlobClient.exists();
    
    if (!newExists) {
      return newBlobPath;
    }
    
    counter++;
  } while (counter < 100); // 最大100個までの連番を試行
  
  throw new UploadError('一意のファイル名を生成できませんでした');
};



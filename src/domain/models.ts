/**
 * ファイル情報を表すモデル
 */
export type FileInfo = {
  /** ファイル名 */
  name: string;
  
  /** ファイルパス */
  path: string;
  
  /** ファイルサイズ（バイト） */
  size: number;
  
  /** MIMEタイプ */
  mimeType: string;
  
  /** 最終更新日時 */
  lastModified: Date;
};

/**
 * アップロード結果を表すモデル
 */
export type UploadResult = {
  /** 元のファイル情報 */
  fileInfo: FileInfo;
  
  /** アップロード先のURL */
  url: string;
  
  /** サムネイルURL（画像の場合のみ） */
  thumbnailUrl?: string;
  
  /** アップロード日時 */
  uploadedAt: Date;
};

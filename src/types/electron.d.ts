// Electronの型定義を拡張
interface Window {
  electronAPI?: {
    showMessage: () => string;
    selectFile: () => Promise<string[]>;
    readFile: (filePath: string) => Promise<Buffer>;
    getFileInfo: (filePath: string) => Promise<any>;
    getConfig: () => Promise<any>;
    saveConfig: (config: any) => Promise<{success: boolean}>;
    uploadFile: (fileInfo: any) => Promise<any>;
    getClipboardImage: () => Promise<any>;
    // アップロード進捗リスナーを登録する関数
    // リスナーを削除する関数を返す
    onUploadProgress: (callback: (progress: {
      bytesTransferred: number;
      totalBytes: number;
      fileName: string;
      percentage: number;
    }) => void) => (() => void) | null;
  }
}

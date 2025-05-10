// Electronの型定義を拡張
interface Window {
  electronAPI?: {
    showMessage: () => string;
    selectFile: () => Promise<string[]>;
    readFile: (filePath: string) => Promise<Buffer>;
    getFileInfo: (filePath: string) => Promise<any>;
    getConfig: () => Promise<any>;
    uploadFile: (fileInfo: any) => Promise<any>;
  }
}

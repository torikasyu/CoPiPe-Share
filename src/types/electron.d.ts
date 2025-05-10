// Electronの型定義を拡張
interface Window {
  electronAPI?: {
    showMessage: () => string;
    readFile: (filePath: string) => Promise<Buffer>;
    getFileInfo: (filePath: string) => Promise<any>;
  }
}

import { contextBridge, ipcRenderer } from 'electron';

// APIの型定義
declare global {
  interface Window {
    electronAPI: {
      showMessage: () => string;
    }
  }
}

// レンダラープロセスに公開するAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
  // ここにIPC通信の関数を追加
  showMessage: () => {
    console.log('showMessage function called');
    return 'Hello World';
  }
});

console.log('Preload script has been loaded');

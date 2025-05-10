// @ts-nocheck
// TypeScriptの型チェックを無効化（プリロードスクリプトはJavaScriptとして実行されるため）
const { contextBridge, ipcRenderer } = require('electron');

console.log('プリロードスクリプトが読み込まれました');

// レンダラープロセスに公開するAPIを定義
try {
  // IPC通信を使用してメインプロセスと通信する方法に変更
  contextBridge.exposeInMainWorld('electronAPI', {
    // テスト用のメッセージ表示関数
    showMessage: () => {
      console.log('showMessage function called');
      return 'Hello World';
    },
    
    // ファイル選択ダイアログを開く
    selectFile: async () => {
      return ipcRenderer.invoke('dialog:openFile');
    },
    
    // ファイル読み込み関数
    readFile: async (filePath) => {
      return ipcRenderer.invoke('file:read', filePath);
    },
    
    // ファイル情報取得関数
    getFileInfo: async (filePath) => {
      return ipcRenderer.invoke('file:getInfo', filePath);
    },
    
    // 設定取得関数
    getConfig: async () => {
      return ipcRenderer.invoke('config:get');
    },
    
    // ファイルアップロード関数
    uploadFile: async (fileInfo) => {
      return ipcRenderer.invoke('file:upload', fileInfo);
    }
  });
  console.log('electronAPIが正常に公開されました');
} catch (error) {
  console.error('プリロードスクリプトエラー:', error);
}

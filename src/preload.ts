// @ts-nocheck
// TypeScriptの型チェックを無効化（プリロードスクリプトはJavaScriptとして実行されるため）
const { contextBridge, ipcRenderer } = require('electron');

console.log('プリロードスクリプトが読み込まれました');

// レンダラープロセスに公開するAPIを定義
try {
  // アップロード進捗リスナーを登録する関数
  const uploadProgressListeners = new Set();
  
  // アップロード進捗イベントを受け取る
  ipcRenderer.on('upload:progress', (_, progress) => {
    // 登録されたすべてのリスナーに進捗情報を通知
    uploadProgressListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('進捗リスナーエラー:', error);
      }
    });
  });
  
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
    
    // 設定保存関数
    saveConfig: async (config) => {
      return ipcRenderer.invoke('config:save', config);
    },
    
    // ファイルアップロード関数
    uploadFile: async (fileInfo) => {
      return ipcRenderer.invoke('file:upload', fileInfo);
    },
    
    // クリップボードから画像を取得する関数
    getClipboardImage: async () => {
      return ipcRenderer.invoke('clipboard:getImage');
    },
    
    // アップロード進捗リスナーを登録する関数
    onUploadProgress: (callback) => {
      if (typeof callback === 'function') {
        uploadProgressListeners.add(callback);
        return () => {
          // リスナーを削除する関数を返す
          uploadProgressListeners.delete(callback);
        };
      }
      return null;
    }
  });
  console.log('electronAPIが正常に公開されました');
} catch (error) {
  console.error('プリロードスクリプトエラー:', error);
}

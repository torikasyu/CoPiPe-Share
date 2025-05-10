import React from 'react';
import ReactDOM from 'react-dom/client';
import { Effect } from 'effect';
import { FileInfo } from './domain/models';
import { uploadFileUseCase } from './application/usecases';
import { mockFileHistoryRepository, mockFileUploadRepository } from './infrastructure/mockRepositories';

// サンプルアプリケーションのコンポーネント
const App: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);

  // サンプルファイル情報
  const sampleFileInfo: FileInfo = {
    name: 'sample.jpg',
    path: '/path/to/sample.jpg',
    size: 1024 * 1024, // 1MB
    mimeType: 'image/jpeg',
    lastModified: new Date(),
  };

  // ファイルアップロードのハンドラー
  const handleUpload = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setMessage('アップロード処理を開始します...');

    // Effect-tsを使用してファイルアップロードのユースケースを実行
    const program = uploadFileUseCase(
      sampleFileInfo,
      mockFileUploadRepository,
      mockFileHistoryRepository
    );

    // プログラムを実行
    const runnable = Effect.runPromise(program);
    
    try {
      const result = await runnable;
      setMessage('アップロードが完了しました');
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('エラー:', error);
      if (error instanceof Error) {
        setError(`エラー: ${error.message}`);
      } else {
        setError('不明なエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Effect-tsサンプルアプリケーション</h1>
      <p>このアプリはEffect-tsを使用したエラーハンドリングのサンプルです。</p>
      
      <button 
        onClick={handleUpload}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#0078d7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'アップロード中...' : 'サンプルファイルをアップロード'}
      </button>
      
      {message && (
        <div style={{ marginTop: '20px' }}>
          <h3>メッセージ:</h3>
          <p>{message}</p>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <h3>エラー:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>結果:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

// DOMにレンダリング
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

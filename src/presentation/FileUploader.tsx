import React, { useState, useRef, ChangeEvent } from 'react';
import { Effect } from 'effect';
import { FileInfo } from '../domain/models';
import { getFileInfo } from '../infrastructure/fileHelper';
import { uploadFileUseCase } from '../application/usecases';
import { mockFileUploadRepository, mockFileHistoryRepository } from '../infrastructure/mockRepositories';

/**
 * ファイルアップロードコンポーネント
 * シンプルなファイル選択とアップロード機能を提供します
 */
const FileUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ハンドラー
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await uploadFile(file);
  };

  // ファイルアップロード処理
  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setMessage('ファイルをアップロード中...');
      setError(null);
      setUploadedUrl(null);

      // Electron APIが利用可能か確認
      if (!window.electronAPI) {
        throw new Error('Electron APIが利用できません');
      }

      // ファイル情報を取得
      let fileInfo: FileInfo;
      
      if (file.path) {
        // Electronの場合、ファイルパスが存在するので、それを使用
        try {
          fileInfo = await window.electronAPI.getFileInfo(file.path);
        } catch (error) {
          console.error('ファイル情報取得エラー:', error);
          // フォールバックとして、ブラウザのファイル情報を使用
          fileInfo = {
            name: file.name,
            path: file.path,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            lastModified: new Date(file.lastModified)
          };
        }
      } else {
        // ブラウザの場合、File APIから情報を取得
        fileInfo = {
          name: file.name,
          path: '', // ブラウザではパスは取得できない
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          lastModified: new Date(file.lastModified)
        };
      }

      console.log('ファイル情報:', fileInfo);

      // アップロードユースケースを実行
      const result = await Effect.runPromise(
        uploadFileUseCase(
          fileInfo,
          mockFileUploadRepository,
          mockFileHistoryRepository
        )
      );

      setMessage('アップロードが完了しました');
      setUploadedUrl(result.url);
      console.log('アップロード結果:', result);
    } catch (error) {
      console.error('アップロードエラー:', error);
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  };

  // URLをクリップボードにコピー
  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl)
        .then(() => setMessage('URLをクリップボードにコピーしました'))
        .catch(err => setError('URLのコピーに失敗しました'));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>ファイルアップロード</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#0078d7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          ファイルを選択
        </button>
      </div>
      
      {isUploading && (
        <div style={{ marginTop: '20px' }}>
          <p>アップロード中...</p>
        </div>
      )}
      
      {message && (
        <div style={{ marginTop: '20px' }}>
          <p>{message}</p>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>エラー: {error}</p>
        </div>
      )}
      
      {uploadedUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>アップロードURL:</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginTop: '10px'
          }}>
            <input
              type="text"
              value={uploadedUrl}
              readOnly
              style={{
                padding: '8px',
                fontSize: '14px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginRight: '10px'
              }}
            />
            <button
              onClick={copyToClipboard}
              style={{
                padding: '8px 15px',
                backgroundColor: '#0078d7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              コピー
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

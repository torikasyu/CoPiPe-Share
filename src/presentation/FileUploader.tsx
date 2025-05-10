import React, { useState, useRef, ChangeEvent, useEffect, ClipboardEvent } from 'react';
import { Effect } from 'effect';
import { FileInfo } from '../domain/models';
import { getFileInfo } from '../infrastructure/fileHelper';
import { uploadFileUseCase } from '../application/usecases';
import { mockFileUploadRepository, mockFileHistoryRepository } from '../infrastructure/mockRepositories';
import { createAzureBlobRepository } from '../infrastructure/azureBlobRepository';
import { AppConfig } from '../domain/config';

/**
 * ファイルアップロードコンポーネント
 * シンプルなファイル選択とアップロード機能を提供します
 */
const FileUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [useMock, setUseMock] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // クリップボードから画像をペーストする処理
  const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    // ペーストイベントを処理
    {
      try {
        // アップロード中は処理しない
        if (isUploading) return;
        
        // Electron APIが利用可能か確認
        if (!window.electronAPI) {
          throw new Error('Electron APIが利用できません');
        }
        
        setIsUploading(true);
        setMessage('クリップボードから画像を取得中...');
        setError(null);
        setUploadedUrl(null);
        
        // クリップボードから画像を取得
        const clipboardResult = await window.electronAPI.getClipboardImage();
        
        if (!clipboardResult.success) {
          throw new Error(clipboardResult.error || 'クリップボードから画像を取得できませんでした');
        }
        
        // ファイル情報を取得
        const fileInfo = clipboardResult.fileInfo;
        console.log('クリップボード画像情報:', fileInfo);
        
        // アップロード処理
        setMessage('クリップボード画像をアップロード中...');
        await uploadFile(fileInfo);
        
      } catch (error) {
        console.error('クリップボード画像ペーストエラー:', error);
        setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
        setIsUploading(false);
      }
    }
  };
  
  // 設定を読み込む
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Electron APIが利用可能か確認
        if (!window.electronAPI) {
          throw new Error('Electron APIが利用できません');
        }
        
        // メインプロセスから設定を取得
        const loadedConfig = await window.electronAPI.getConfig();
        setConfig(loadedConfig);
        
        // 接続文字列が設定されている場合はモックを無効化
        if (loadedConfig.azureStorage.connectionString) {
          setUseMock(false);
          setMessage('Azure Blob Storageに接続しました');
        } else {
          setUseMock(true);
          setMessage('モックリポジトリを使用します（設定ファイルに接続文字列がありません）');
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
        setError('設定の読み込みに失敗しました');
        setUseMock(true);
      }
    };
    
    loadConfig();
  }, []);

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

      // メインプロセスのアップロード機能を使用
      const uploadResponse = await window.electronAPI.uploadFile(fileInfo);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'アップロードに失敗しました');
      }
      
      const result = uploadResponse.result;
      
      // モックか実際のAzure Blobかを表示
      setMessage(uploadResponse.usedMock 
        ? 'モックアップロードが完了しました' 
        : 'Azure Blob Storageへのアップロードが完了しました');
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
    <div 
      ref={containerRef}
      style={{ padding: '20px', fontFamily: 'sans-serif' }}
      tabIndex={0} // キーボードイベントを受け取るためにtabIndexを設定
      onPaste={handlePaste} // ペーストイベントをハンドル
    >
      <h2>ファイルアップロード</h2>
      <p>ファイルを選択するか、Ctrl+V（またはCmd+V）でクリップボードから画像をペーストしてください。</p>
      
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

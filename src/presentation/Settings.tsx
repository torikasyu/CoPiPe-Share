import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Effect } from 'effect';

// 設定画面のスタイル
const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #106ebe;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d13438;
  font-size: 14px;
  margin-top: 8px;
`;

const SuccessMessage = styled.div`
  color: #107c10;
  font-size: 14px;
  margin-top: 8px;
`;

// 設定画面のコンポーネント
const Settings: React.FC = () => {
  // 設定の状態
  const [connectionString, setConnectionString] = useState('');
  const [containerName, setContainerName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [maxFileSizeBytes, setMaxFileSizeBytes] = useState(10 * 1024 * 1024); // デフォルト: 10MB
  const [supportedImageFormats, setSupportedImageFormats] = useState('jpg,jpeg,png');
  const [supportedDocumentFormats, setSupportedDocumentFormats] = useState('pdf');
  
  // UI状態
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 設定を読み込む
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        
        // Electronの設定取得APIを呼び出し
        if (!window.electronAPI) {
          throw new Error('Electron APIが利用できません');
        }
        
        const config = await window.electronAPI.getConfig();
        
        // 設定を状態にセット
        setConnectionString(config.azureStorage.connectionString || '');
        setContainerName(config.azureStorage.containerName || 'uploads');
        setBaseUrl(config.azureStorage.baseUrl || '');
        setMaxFileSizeBytes(config.general.maxFileSizeBytes || 10 * 1024 * 1024);
        setSupportedImageFormats(config.general.supportedImageFormats.join(','));
        setSupportedDocumentFormats(config.general.supportedDocumentFormats.join(','));
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
        setErrorMessage('設定の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);
  
  // 設定を保存する
  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Electron APIが利用可能か確認
      if (!window.electronAPI) {
        throw new Error('Electron APIが利用できません');
      }
      
      // 設定オブジェクトを作成
      const config = {
        azureStorage: {
          connectionString,
          containerName,
          baseUrl: baseUrl || undefined,
        },
        general: {
          maxFileSizeBytes,
          supportedImageFormats: supportedImageFormats.split(',').map(format => format.trim()),
          supportedDocumentFormats: supportedDocumentFormats.split(',').map(format => format.trim()),
        },
      };
      
      // 設定を保存
      await window.electronAPI.saveConfig(config);
      
      setSuccessMessage('設定を保存しました。');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setErrorMessage('設定の保存に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ファイルサイズをMBに変換
  const fileSizeInMB = maxFileSizeBytes / (1024 * 1024);
  
  return (
    <SettingsContainer>
      <h1>設定</h1>
      
      <SettingsForm onSubmit={saveConfig}>
        <h2>Azure Blob Storage 設定</h2>
        
        <FormGroup>
          <Label htmlFor="connectionString">接続文字列</Label>
          <Input
            id="connectionString"
            type="password"
            value={connectionString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConnectionString(e.target.value)}
            placeholder="Azure Blob Storageの接続文字列を入力してください"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="containerName">コンテナ名</Label>
          <Input
            id="containerName"
            type="text"
            value={containerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContainerName(e.target.value)}
            placeholder="コンテナ名を入力してください"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="baseUrl">公開URLのベースパス（オプション）</Label>
          <Input
            id="baseUrl"
            type="text"
            value={baseUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseUrl(e.target.value)}
            placeholder="例: https://example.blob.core.windows.net/container"
          />
        </FormGroup>
        
        <h2>一般設定</h2>
        
        <FormGroup>
          <Label htmlFor="maxFileSize">最大ファイルサイズ（MB）</Label>
          <Input
            id="maxFileSize"
            type="number"
            min="1"
            max="100"
            step="1"
            value={fileSizeInMB}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxFileSizeBytes(Number(e.target.value) * 1024 * 1024)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="supportedImageFormats">対応画像形式（カンマ区切り）</Label>
          <Input
            id="supportedImageFormats"
            type="text"
            value={supportedImageFormats}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupportedImageFormats(e.target.value)}
            placeholder="例: jpg,jpeg,png"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="supportedDocumentFormats">対応ドキュメント形式（カンマ区切り）</Label>
          <Input
            id="supportedDocumentFormats"
            type="text"
            value={supportedDocumentFormats}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupportedDocumentFormats(e.target.value)}
            placeholder="例: pdf"
            required
          />
        </FormGroup>
        
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : '設定を保存'}
        </Button>
      </SettingsForm>
    </SettingsContainer>
  );
};

export default Settings;

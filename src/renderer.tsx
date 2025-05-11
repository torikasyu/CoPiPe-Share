import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';
import FileUploader from './presentation/FileUploader';
import Settings from './presentation/Settings';

// スタイル定義
const AppContainer = styled.div`
  padding: 20px;
  font-family: sans-serif;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 10px;
`;

const NavButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.$active ? '#0078d4' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#106ebe' : '#e0e0e0'};
  }
`;

// 画面の種類を表す型
type Screen = 'uploader' | 'settings';

// アプリケーションのメインコンポーネント
const App: React.FC = () => {
  // 現在の画面
  const [currentScreen, setCurrentScreen] = useState<Screen>('uploader');
  
  // 画面を切り替える関数
  const switchScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };
  
  return (
    <AppContainer>
      <Header>
        <Title>Azure Blob Storage アップローダー</Title>
        {currentScreen === 'uploader' ? (
          <NavButton 
            $active={true}
            onClick={() => switchScreen('settings')}
          >
            設定
          </NavButton>
        ) : (
          <NavButton 
            $active={true}
            onClick={() => switchScreen('uploader')}
          >
            アップロード
          </NavButton>
        )}
      </Header>
      
      {currentScreen === 'uploader' && <FileUploader />}
      {currentScreen === 'settings' && <Settings />}
    </AppContainer>
  );
};

// DOMにレンダリング
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import FileUploader from './presentation/FileUploader';

// アプリケーションのメインコンポーネント
const App: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <FileUploader />
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

const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');
require('dotenv').config();

/**
 * Appleの公証サービスにアプリを送信するための関数
 */
exports.default = async function notarizing(context) {
  // macOS以外のプラットフォームでは何もしない
  if (context.electronPlatformName !== 'darwin') {
    return;
  }
  
  // 環境変数が設定されていない場合は公証をスキップ
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('警告: 公証をスキップします。APPLE_IDとAPPLE_APP_SPECIFIC_PASSWORDの環境変数が設定されていません。');
    return;
  }
  
  console.log('アプリケーションの公証を開始します...');
  
  // 出力されたアプリのパス
  const appPath = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  
  try {
    console.log(`公証情報: 
      - Apple ID: ${process.env.APPLE_ID}
      - チームID: ${process.env.APPLE_TEAM_ID}
      - アプリパス: ${appPath}/${appName}.app
      - アプリバンドルID: ${build.appId}
    `);
    
    // 公証プロセスを実行
    await notarize({
      appBundleId: build.appId,
      appPath: `${appPath}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID, // teamIdパラメータを正しく設定
      debug: true // デバッグ情報を表示
    });
    
    console.log('公証が完了しました！');
  } catch (error) {
    console.error('公証中にエラーが発生しました:', error);
    throw error;
  }
};

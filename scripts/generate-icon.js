const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// アイコンのサイズを設定
const size = 1024;

// キャンバスを作成
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// 背景を描画
ctx.fillStyle = '#3498db'; // 青色の背景
ctx.fillRect(0, 0, size, size);

// 中央に雲のアイコンを描画
ctx.fillStyle = '#ffffff';
ctx.beginPath();
// 雲の形状を描画
const cloudCenterX = size / 2;
const cloudCenterY = size / 2;
const cloudRadius = size / 3;

// 雲の丸い部分を描画
ctx.arc(cloudCenterX - cloudRadius * 0.5, cloudCenterY, cloudRadius * 0.5, 0, Math.PI * 2);
ctx.arc(cloudCenterX + cloudRadius * 0.5, cloudCenterY, cloudRadius * 0.5, 0, Math.PI * 2);
ctx.arc(cloudCenterX, cloudCenterY - cloudRadius * 0.3, cloudRadius * 0.5, 0, Math.PI * 2);
ctx.arc(cloudCenterX, cloudCenterY + cloudRadius * 0.3, cloudRadius * 0.5, 0, Math.PI * 2);
ctx.fill();

// 上向き矢印を描画（アップロードを表現）
ctx.fillStyle = '#2ecc71'; // 緑色の矢印
ctx.beginPath();
const arrowWidth = size * 0.2;
const arrowHeight = size * 0.3;
const arrowX = size / 2 - arrowWidth / 2;
const arrowY = size / 2 + size * 0.05;

// 矢印の本体
ctx.fillRect(arrowX + arrowWidth * 0.3, arrowY - arrowHeight * 0.8, arrowWidth * 0.4, arrowHeight * 0.8);

// 矢印の頭
ctx.moveTo(arrowX, arrowY - arrowHeight * 0.8);
ctx.lineTo(arrowX + arrowWidth / 2, arrowY - arrowHeight);
ctx.lineTo(arrowX + arrowWidth, arrowY - arrowHeight * 0.8);
ctx.fill();

// 出力ディレクトリを確認・作成
const outputDir = path.join(__dirname, '../build/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// PNGとして保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(outputDir, 'icon.png'), buffer);

console.log('アイコンが生成されました: build/icons/icon.png');

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * 画像のサムネイルを生成する関数
 * @param filePath 元画像のファイルパス
 * @param width サムネイルの幅（ピクセル）
 * @returns 生成されたサムネイルのファイルパス
 */
export const generateThumbnail = async (filePath: string, width: number = 320): Promise<string> => {
  try {
    // ファイルパスを解析
    const parsedPath = path.parse(filePath);
    const directory = parsedPath.dir;
    const filename = parsedPath.name;
    const extension = parsedPath.ext.toLowerCase();
    
    // サポートされている画像形式かチェック
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) {
      throw new Error(`サポートされていない画像形式です: ${extension}`);
    }
    
    // 現在の日時からタイムスタンプを生成（YYYYMMDDHHmmss形式）
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0'),
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0')
    ].join('');
    
    // サムネイルのファイル名を生成
    const thumbnailFilename = `${filename}_${timestamp}_${width}${extension}`;
    const thumbnailPath = path.join(directory, thumbnailFilename);
    
    // 画像のリサイズ処理
    await sharp(filePath)
      .resize({
        width,
        withoutEnlargement: true, // 元画像より大きくしない
      })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('サムネイル生成エラー:', error);
    throw error;
  }
};

/**
 * 画像ファイルかどうかを判定する関数
 * @param filePath ファイルパス
 * @returns 画像ファイルの場合はtrue、それ以外はfalse
 */
export const isImageFile = (filePath: string): boolean => {
  const extension = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(extension);
};

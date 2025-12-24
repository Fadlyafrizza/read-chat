import { Config } from '../constants/config';

export class Validators {
  static isValidZipFile(uri: string): boolean {
    return Config.supportedFormats.some(format => uri.toLowerCase().endsWith(format));
  }

  static isValidFileSize(size: number): boolean {
    return size <= Config.maxFileSize;
  }

  static getMediaType(filename: string): 'image' | 'video' | 'audio' | 'document' | null {
    const lower = filename.toLowerCase();
    
    if (Config.mediaExtensions.image.some(ext => lower.endsWith(ext))) {
      return 'image';
    }
    if (Config.mediaExtensions.video.some(ext => lower.endsWith(ext))) {
      return 'video';
    }
    if (Config.mediaExtensions.audio.some(ext => lower.endsWith(ext))) {
      return 'audio';
    }
    if (Config.mediaExtensions.document.some(ext => lower.endsWith(ext))) {
      return 'document';
    }
    
    return null;
  }

  static sanitizeString(str: string): string {
    if (!str) return '';
    return str.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
  }
}

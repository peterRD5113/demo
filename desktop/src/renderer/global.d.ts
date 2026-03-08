/**
 * 全局類型聲明
 * 為渲染進程提供 electronAPI 的類型定義
 */

import type { ElectronAPI } from '../preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};

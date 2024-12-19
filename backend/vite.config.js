import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',  // 設定輸出目錄
    target: 'node16',  // 目標設為 Node.js 版本
    rollupOptions: {
      input: resolve(__dirname, 'server.js'),  // 你的 server.js 路徑
      output: {
        format: 'es',  // 設定輸出格式為 ES 模塊
        entryFileNames: 'server.mjs',  // 輸出文件名稱，這裡是 .mjs
      },
      external: [
        'puppeteer-core',
        '@puppeteer/browsers',
        'assert',
        'url',
        'util',
        'path',
        'fs',
        'os',
        'fs/promises',
        'child_process',
        'stream',
        'process'
      ],  // 排除 Node.js 內建模塊
    },
  },
});

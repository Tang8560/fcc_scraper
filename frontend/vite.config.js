import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // 設定打包輸出的目錄
    assetsDir: 'assets',
    sourcemap: true, // 啟用 sourcemap 以便於調試
    rollupOptions: {
      input: 'index.html', // 預設入口文件
    },
  },
})

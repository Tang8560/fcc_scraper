export default {
    presets: [
      '@babel/preset-env',  // 支持現代 JavaScript
      '@babel/preset-react' // 支持 React 語法
    ],
    plugins: [
      '@babel/plugin-syntax-import-meta' // 允許使用 import.meta
    ]
  };
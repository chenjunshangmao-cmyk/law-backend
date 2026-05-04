import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

// 读取版本号
let version = 'dev'
try {
  const versionFile = resolve(__dirname, '../VERSION.md')
  if (existsSync(versionFile)) {
    const content = readFileSync(versionFile, 'utf-8')
    const match = content.match(/\*\*([\d.]+)\*\*/)
    if (match) version = match[1]
  }
} catch {}

export default defineConfig({
  plugins: [react()],
  define: {
    __CLAW_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../complete-deploy',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/app.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://claw-backend-2026.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

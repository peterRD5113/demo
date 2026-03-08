import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/main',
    lib: {
      entry: path.resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'bcryptjs',
        'jsonwebtoken',
        'crypto-js',
        'mammoth',
        'pdf-lib',
        'pdfjs-dist',
        'docx',
        'diff-match-patch'
      ]
    },
    minify: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
});

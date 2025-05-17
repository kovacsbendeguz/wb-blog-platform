import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://og1xa3rd04.execute-api.eu-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/prod')
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  define: { 
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.API_URL || 'https://og1xa3rd04.execute-api.eu-central-1.amazonaws.com/prod')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true
  }
});
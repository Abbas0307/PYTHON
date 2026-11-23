import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
          if (id.includes('modelMetricsData') || id.includes('resourceCatalogue')) {
            return 'static-catalogues';
          }
          if (id.includes('RealWorldDatasetScreen') || id.includes('LargeDatasetScreen')) {
            return 'screen-datasets';
          }
          if (id.includes('ModelLabScreen') || id.includes('ModelComparisonScreen')) {
            return 'screen-models';
          }
          if (id.includes('AIFeelingsSpaceScreen')) {
            return 'screen-feelings-space';
          }
          if (id.includes('MiniGamesScreen') || id.includes('BlockGame') || id.includes('SnakeGame')) {
            return 'screen-games';
          }
        },
      },
    },
  },
});

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-image-magnify-lib': path.resolve(__dirname, 'src/features/landing/lib/reactImageMagnifyLib.ts'),
    },
  },
  css: {
    // Lightning CSS (Rust): transform más rápido que el pipeline PostCSS por defecto
    transformer: 'lightningcss',
  },
  build: {
    cssMinify: 'lightningcss',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rolldownOptions: {
      checks: {
        // Evita el warning [PLUGIN_TIMINGS] (p. ej. prepare-out-dir en Windows)
        pluginTimings: false,
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})

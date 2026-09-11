import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: /^react-image-magnify-lib$/, replacement: path.resolve(__dirname, 'src/features/landing/lib/reactImageMagnifyLib.ts') },
    ],
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
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/features/landing/chat/answerChat.ts',
        'src/features/landing/chat/prepare.ts',
        'src/features/landing/chat/matchers.ts',
        'src/features/landing/chat/composeReply.ts',
        'src/features/landing/chat/sessionContext.ts',
      ],
    },
  },
})

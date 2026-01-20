import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    assetsInlineLimit: 0 // Disable inlining assets as base64
  }
})

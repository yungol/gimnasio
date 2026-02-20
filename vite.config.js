import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  base: '/gimnasio/',
  plugins: [
    vue(),
    viteSingleFile()
  ],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
})

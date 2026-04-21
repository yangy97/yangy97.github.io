import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 资源路径前缀 —— 影响打包后 index.html 里 /assets 的写法
 * - './'  ：相对路径，整份 `love/` 拷贝到任意目录、用静态服务器打开均可（推荐「单独拷贝」）
 * - '/love/'：部署在 https://username.github.io/love/ 时用（子路径站点）
 * '/'：仅适合站点挂在域名根目录时使用；用「绝对路径」拷贝到子文件夹会 404
 */
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: resolve(__dirname, '../love'),
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})

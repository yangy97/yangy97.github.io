import { rmSync, cpSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pub = join(root, 'public')
const lovewjl = join(root, '..', 'lovewjl')

const dirs = ['css', 'fonts', 'img', 'js', 'music']

for (const d of dirs) {
  const src = join(lovewjl, d)
  const dest = join(pub, d)
  if (!existsSync(src)) {
    console.error('[sync-assets] 找不到目录:', src)
    process.exit(1)
  }
  rmSync(dest, { recursive: true, force: true })
  cpSync(src, dest, { recursive: true })
}

console.log('[sync-assets] 已从 lovewjl 同步', dirs.join(', '))

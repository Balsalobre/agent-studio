import { defineConfig, loadEnv } from 'vite'
import { readFileSync, cpSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const studioDir = resolve(import.meta.dirname, 'node_modules/mastra/dist/studio')

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'MASTRA_')
  const processEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('MASTRA_'))
  )
  const env = { ...fileEnv, ...processEnv }

  return {
    plugins: [
      {
        name: 'mastra-studio',
        closeBundle() {
          const outDir = resolve(import.meta.dirname, 'dist')
          cpSync(studioDir, outDir, { recursive: true })

          const indexPath = join(outDir, 'index.html')
          const html = readFileSync(indexPath, 'utf-8')
          writeFileSync(
            indexPath,
            html.replaceAll(/%%(\w+)%%/g, (_, key) => env[key] ?? ''),
          )
        },
      },
    ],
    build: {
      emptyOutDir: true,
    },
  }
})

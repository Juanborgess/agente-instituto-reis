import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const buildTimestamp = Date.now().toString()

// Plugin Vite para gerar o arquivo version.json a cada build automaticamente
function autoVersionPlugin() {
  return {
    name: 'auto-version-plugin',
    buildStart() {
      const versionData = {
        version: '1.1.0',
        buildTime: buildTimestamp,
        buildDate: new Date().toISOString()
      }
      const publicDir = path.resolve(__dirname, 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
      fs.writeFileSync(
        path.resolve(publicDir, 'version.json'),
        JSON.stringify(versionData, null, 2)
      )
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoVersionPlugin()],
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __APP_VERSION__: JSON.stringify('1.1.0')
  }
})


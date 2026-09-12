import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const outputDir = path.resolve(root, '..', '交付包')
const outputFile = path.join(outputDir, 'shengyitong-demo-standalone.html')

const mimeByExt = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function readUtf8(file) {
  return fs.readFileSync(file, 'utf8')
}

function toDataUri(file) {
  const ext = path.extname(file).toLowerCase()
  const mime = mimeByExt[ext] ?? 'application/octet-stream'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

function inlinePublicAssets(content) {
  const files = fs.existsSync(dist) ? fs.readdirSync(dist) : []
  for (const name of files) {
    const file = path.join(dist, name)
    if (!fs.statSync(file).isFile()) continue
    if (!mimeByExt[path.extname(name).toLowerCase()]) continue
    const dataUri = toDataUri(file)
    content = content
      .replaceAll(`"/${name}"`, `"${dataUri}"`)
      .replaceAll(`'/${name}'`, `'${dataUri}'`)
      .replaceAll(`(/${name})`, `(${dataUri})`)
      .replaceAll(`href="/${name}"`, `href="${dataUri}"`)
      .replaceAll(`src="/${name}"`, `src="${dataUri}"`)
  }
  return content
}

let html = readUtf8(path.join(dist, 'index.html'))

html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g, (_match, href) => {
  const cssPath = path.join(dist, href.replace(/^\//, ''))
  const css = inlinePublicAssets(readUtf8(cssPath))
  return `<style>\n${css}\n</style>`
})

html = html.replace(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/g, (_match, src) => {
  const jsPath = path.join(dist, src.replace(/^\//, ''))
  const js = inlinePublicAssets(readUtf8(jsPath))
  return `<script type="module">\n${js}\n</script>`
})

html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '')
html = inlinePublicAssets(html)

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputFile, html)

console.log(outputFile)

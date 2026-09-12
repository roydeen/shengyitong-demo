import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const dist = path.join(root, 'dist')
const deliveryRoot = path.resolve(root, '..', '交付包')
const packageDir = path.join(deliveryRoot, 'shengyitong-html-demo-package')
const zipFile = path.join(deliveryRoot, 'shengyitong-html-demo-package.zip')

const mimeByExt = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true })
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(target, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function rewritePortablePaths(content) {
  return content
    .replaceAll('"/assets/', '"./assets/')
    .replaceAll("'/assets/", "'./assets/")
    .replaceAll('href="/assets/', 'href="./assets/')
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll('"/shengyitong-robot-logo.png"', '"./logo/shengyitong-robot-logo.png"')
    .replaceAll("'\/shengyitong-robot-logo.png'", "'./logo/shengyitong-robot-logo.png'")
    .replaceAll('src="/shengyitong-robot-logo.png"', 'src="./logo/shengyitong-robot-logo.png"')
    .replaceAll('href="/shengyitong-robot-logo.png"', 'href="./logo/shengyitong-robot-logo.png"')
    .replaceAll('"/shengyitong-text-logo.png"', '"./logo/shengyitong-text-logo.png"')
    .replaceAll("'\/shengyitong-text-logo.png'", "'./logo/shengyitong-text-logo.png'")
    .replaceAll('src="/shengyitong-text-logo.png"', 'src="./logo/shengyitong-text-logo.png"')
    .replaceAll('"/shengyitong-chat-robot.png"', '"./logo/shengyitong-chat-robot.png"')
    .replaceAll("'\/shengyitong-chat-robot.png'", "'./logo/shengyitong-chat-robot.png'")
}

function toDataUri(file) {
  const ext = path.extname(file).toLowerCase()
  const mime = mimeByExt[ext] ?? 'application/octet-stream'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

function inlineDistAssets(content) {
  const files = fs.readdirSync(dist)
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

function createHtmlEntrypoint(fileName, hash) {
  let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

  html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g, (_match, href) => {
    const css = fs.readFileSync(path.join(dist, href.replace(/^\//, '')), 'utf8')
    return `<style>\n${inlineDistAssets(css)}\n</style>`
  })

  html = html.replace(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/g, (_match, src) => {
    const js = fs.readFileSync(path.join(dist, src.replace(/^\//, '')), 'utf8')
    return `<script type="module">\n${inlineDistAssets(js)}\n</script>`
  })

  html = html.replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '')
  html = inlineDistAssets(rewritePortablePaths(html))

  if (hash) {
    html = html.replace(
      '<head>',
      `<head>\n    <script>if (!location.hash) location.hash = '${hash}';</script>`,
    )
  }
  fs.writeFileSync(path.join(packageDir, fileName), html)
}

rmrf(packageDir)
rmrf(zipFile)
fs.mkdirSync(path.join(packageDir, 'logo'), { recursive: true })

for (const name of ['shengyitong-robot-logo.png', 'shengyitong-text-logo.png', 'shengyitong-chat-robot.png']) {
  const source = path.join(dist, name)
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(packageDir, 'logo', name))
}

createHtmlEntrypoint('01-home.html', '')
createHtmlEntrypoint('02-channel-profit-report.html', '#/reports/channel-profit')

fs.writeFileSync(
  path.join(packageDir, 'README.txt'),
  [
    '盛意通经营平台 HTML 演示包',
    '',
    '使用方式：',
    '1. 解压整个文件夹。',
    '2. 双击 01-home.html 查看主界面。',
    '3. 双击 02-channel-profit-report.html 查看报表页。',
    '',
    '说明：HTML 已内嵌脚本、样式和 Logo，可直接双击打开。logo 文件夹仅用于查看或复用图片素材。',
  ].join('\r\n'),
)

execFileSync('tar.exe', ['-a', '-cf', zipFile, '-C', deliveryRoot, path.basename(packageDir)], { stdio: 'inherit' })

console.log(zipFile)

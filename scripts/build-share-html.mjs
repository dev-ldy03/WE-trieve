// 팀원 공유용: 웹 앱을 HTML 파일 하나(share/wetriever.html)로 만든다.
// 더블클릭(file://)으로 열어도 동작하도록 스크립트·CSS·이미지를 모두 안에 넣는다.
//
//   npm run share:html
//
// file://에서는 주소(pathname)를 바꿀 수 없으므로
//  1) 빌드할 때 기준 경로를 자리표시자(/__WTBASE__)로 두고, 열 때 실제 파일 경로로 바꿔 끼우고
//  2) 주소 바꾸기(history.pushState)가 실패해도 앱은 그대로 화면만 바뀌게 한다.
// 지도 타일(OpenStreetMap)은 인터넷이 연결돼 있어야 보인다.

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const BASE = '/__WTBASE__'
const appJsonPath = join(root, 'app.json')
const originalAppJson = readFileSync(appJsonPath, 'utf8')
const outDir = mkdtempSync(join(tmpdir(), 'wetriever-share-'))

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}
const dataUri = (file) => `data:${MIME[extname(file)] ?? 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

try {
  // 1) 한 페이지(single) 출력 + 자리표시자 기준 경로로 잠시 바꿔 내보낸다
  const app = JSON.parse(originalAppJson)
  app.expo.web = { ...app.expo.web, output: 'single' }
  app.expo.experiments = { ...app.expo.experiments, baseUrl: BASE }
  // 화면별 조각 파일로 나누지 않고 한 번들에 담는다
  app.expo.plugins = app.expo.plugins.map((p) => (p === 'expo-router' ? ['expo-router', { asyncRoutes: false }] : p))
  writeFileSync(appJsonPath, JSON.stringify(app, null, 2) + '\n')
  execSync(`npx expo export --platform web --output-dir "${outDir}" --clear`, { cwd: root, stdio: 'inherit' })
} finally {
  writeFileSync(appJsonPath, originalAppJson)
}

// 2) 내보낸 파일을 경로 → 파일로 찾을 수 있게 한다 (/__WTBASE__/… → outDir/…)
const fileFor = (url) => join(outDir, decodeURIComponent(url.replace(BASE, '').split('?')[0]))
let html = readFileSync(join(outDir, 'index.html'), 'utf8')

// 이미지·글꼴: 번들 안의 "/__WTBASE__/assets/…" 주소를 data URI로 바꾼다
const assets = walk(outDir).filter((f) => f.includes('/assets/'))
const inlineAssets = (code) => {
  for (const file of assets) {
    const url = BASE + file.slice(outDir.length)
    if (code.includes(url)) code = code.split(url).join(dataUri(file))
  }
  return code
}

// 스크립트: <script src> → 안에 넣기. 남은 기준 경로 문자열은 실행 시 정해지는 값으로 바꾼다
html = html.replace(/<script([^>]*?)src="([^"]+)"([^>]*)><\/script>/g, (_, a, src, b) => {
  let code = inlineAssets(readFileSync(fileFor(src), 'utf8'))
  code = code.split(`"${BASE}"`).join('window.__WT_BASE__')
  code = code.replace(/<\/script/gi, '<\\/script')
  return `<script${a.replace(/\s*defer(="")?/, '')}${b}>${code}</script>`
})

// CSS: <link rel="stylesheet"> → <style>, preload 링크는 지운다
html = html.replace(/<link[^>]*rel="preload"[^>]*>/g, '')
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${inlineAssets(readFileSync(fileFor(href), 'utf8'))}</style>`)
html = html.replace(/<link[^>]*rel="icon"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<link rel="icon" href="${dataUri(fileFor(href))}">`)

// 3) 앱보다 먼저 실행: 기준 경로를 이 파일의 경로로, 주소 바꾸기 실패는 조용히 넘긴다
const boot = `<script>
window.__WT_BASE__ = location.protocol === 'file:' ? location.pathname : '';
['pushState', 'replaceState'].forEach(function (name) {
  var original = history[name].bind(history);
  history[name] = function (state, title, url) {
    try { return original(state, title, url) } catch (e) { return original(state, title) }
  };
});
</script>`
html = html.replace('<head>', `<head>${boot}`)

if (html.includes(BASE)) console.warn('⚠️ 아직 바꾸지 못한 기준 경로가 남아 있어요:', (html.match(new RegExp(`${BASE}[^"']*`, 'g')) ?? []).slice(0, 5))

const shareDir = join(root, 'share')
if (!existsSync(shareDir)) mkdirSync(shareDir)
const target = join(shareDir, 'wetriever.html')
writeFileSync(target, html)
rmSync(outDir, { recursive: true, force: true })
console.log(`\n✅ ${target} (${(html.length / 1024 / 1024).toFixed(1)}MB)`)

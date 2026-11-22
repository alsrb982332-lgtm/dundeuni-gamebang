/* 1단계: 기존 게임 6개를 게임방에 「그대로 넣기」 위한 복사본 만들기
   ─────────────────────────────────────────────
   원본(legacy/)은 읽기만 하고 절대 고치지 않습니다. 결과는 public/legacy/<id>/ 에 씁니다.
   (legacy/ 는 개인정보 때문에 저장소에 없으므로, 결과물은 저장소에 커밋해 둡니다)

   바꾸는 것 (CLAUDE.md 「원본 보호」「개인정보」)
   - 모든 게임: 글꼴을 인터넷(Google Fonts) 대신 로컬 파일로 → 오프라인 동작, 검색엔진 차단 meta
   - 따라 쓰기·블록: 아이 사진 → 캐릭터 아바타, 실명 → 게임방 설정의 이름(기본 「형」「동생」)
   - 공룡나라: 없는 그림 파일(images/001~100.png)을 찾느라 시작할 때마다 요청 200번 → 안 찾음
   - Vite 게임 3개: 이름 기본값을 「형」「동생」으로, 아이 이름 로마자 id 를 중립 id(hyeong/dong)로,
     게임마다 따로 있던 PWA(서비스 워커) 제거 (게임방 PWA 하나로), 글꼴은 공용 파일 사용

   사용: npm run legacy   (원본이 있는 이 PC에서만 실행 가능) */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { avatarSVG, svgDataURI, PALETTE } from '../src/shared/art/svg.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LEGACY = path.join(ROOT, 'legacy')
const OUT = path.join(ROOT, 'public', 'legacy')
const WORK = path.join(ROOT, '.work')
const TODAY = new Date().toISOString().slice(0, 10)

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const want = (id) => !only.length || only.includes(id)

/** 문자열 바꾸기 — 바꿀 곳을 못 찾으면 멈춤 (원본이 바뀌었는데 모르고 넘어가지 않게) */
function replaceOnce(text, from, to, what) {
  const n = typeof from === 'string' ? text.split(from).length - 1 : (text.match(new RegExp(from.source, from.flags.includes('g') ? from.flags : from.flags + 'g')) || []).length
  if (n < 1) throw new Error(`바꿀 곳을 못 찾음: ${what}`)
  return typeof from === 'string' ? text.split(from).join(to) : text.replace(from, to)
}

/* ---------- 공용 글꼴: public/fonts/jua.css + woff2 ---------- */
function buildFonts() {
  const src = path.join(ROOT, 'node_modules', '@fontsource', 'jua')
  const dest = path.join(ROOT, 'public', 'fonts')
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(path.join(dest, 'jua'), { recursive: true })
  let css = fs.readFileSync(path.join(src, 'index.css'), 'utf8')
  css = css.replace(/url\(\.\/files\/([^)]+)\.woff2\) format\('woff2'\), url\(\.\/files\/[^)]+\.woff\) format\('woff'\)/g, "url(./jua/$1.woff2) format('woff2')")
  if (/\.woff\)/.test(css)) throw new Error('글꼴 css 변환 실패')
  fs.writeFileSync(path.join(dest, 'jua.css'), `/* Jua 글꼴 (SIL Open Font License) — @fontsource/jua 에서 복사, ${TODAY} */\n` + css)
  for (const f of fs.readdirSync(path.join(src, 'files'))) if (f.endsWith('.woff2')) fs.copyFileSync(path.join(src, 'files', f), path.join(dest, 'jua', f))
  console.log('✔ 글꼴 → public/fonts/')
}

/* ---------- HTML 게임 3개 ---------- */
const header = (src, changes) =>
  `<!-- 든든이 게임방 1단계 복사본 · 원본: legacy/${src} · 만든 날: ${TODAY} · scripts/build-legacy.mjs 로 자동 생성 (직접 고치지 말 것)\n     바꾼 것: ${changes.join(' / ')} -->\n`

function commonHtml(html) {
  const fontLinks =
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\r?\n<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\r?\n<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Jua&display=swap" rel="stylesheet">/
  html = replaceOnce(html, fontLinks, '<link rel="stylesheet" href="../../fonts/jua.css">\n<meta name="robots" content="noindex, nofollow">', '글꼴 링크')
  if (/fonts\.googleapis|fonts\.gstatic/.test(html)) throw new Error('인터넷 글꼴 링크가 남아 있음')
  return html
}

/* 게임방 설정(dundeuni:settings)의 아이 이름을 읽는 작은 함수 — 없으면 「형」「동생」 */
const DDN = `const DDN=k=>{try{const s=JSON.parse(localStorage.getItem('dundeuni:settings')||'{}');const n=s&&s.names&&s.names[k];if(n&&String(n).trim())return String(n).trim()}catch(e){}return k==='hyeong'?'형':'동생'};`

function kidAvatars() {
  return { hyeong: svgDataURI(avatarSVG('bear', PALETTE.sky)), dong: svgDataURI(avatarSVG('bunny', PALETTE.lime)) }
}

/* 원본에 들어 있는 아이 이름은 이 스크립트에 쓰지 않고, 이 PC에만 있는 .private-names.json 에서 읽음
   { "hyeong": { "ko": ["…"], "roman": ["…"] }, "dong": { "ko": [...], "roman": [...] } } */
const NAMES = (() => {
  const f = path.join(ROOT, '.private-names.json')
  if (!fs.existsSync(f)) { console.error('.private-names.json 이 없어요 (CLAUDE.md 5장).'); process.exit(1) }
  return JSON.parse(fs.readFileSync(f, 'utf8'))
})()
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const ALL_NAME_WORDS = ['hyeong', 'dong'].flatMap((r) => [...NAMES[r].ko, ...NAMES[r].roman])
const leftover = new RegExp('data:image/jpeg|' + ALL_NAME_WORDS.map(escRe).join('|'))

function sanitizeKids(html, what) {
  const av = kidAvatars()
  /* 아이 사진 두 장 → 아바타 그림 */
  html = replaceOnce(html, /const PHOTOS=\{[a-z]+:'data:image\/jpeg;base64,[^']*',[a-z]+:'data:image\/jpeg;base64,[^']*'\};/,
    `${DDN}\nconst PHOTOS={hyeong:'${av.hyeong}',dong:'${av.dong}'};`, what + ' 사진')
  /* 아이 목록 → 중립 id + 게임방 설정의 이름 */
  html = replaceOnce(html, /const KIDS=\[\{id:'[a-z]+',name:'[^']+',color:'blue'\},\{id:'[a-z]+',name:'[^']+',color:'orange'\}\];/,
    "const KIDS=[{id:'hyeong',name:DDN('hyeong'),color:'blue'},{id:'dong',name:DDN('dong'),color:'orange'}];", what + ' 이름')
  /* 「○○, ○○ 모두 처음부터」 같은 남은 글자 */
  for (const [r, word] of [['hyeong', '형'], ['dong', '동생']]) for (const n of NAMES[r].ko) html = html.split(n).join(word)
  if (leftover.test(html)) throw new Error(what + ': 사진이나 이름이 아직 남아 있음')
  return html
}

const HTML_GAMES = [
  {
    id: 'dino', src: '든든 공룡나라.html',
    changes: ['글꼴 로컬', '없는 그림 파일 찾기 끔'],
    fix: (h) => replaceOnce(h, 'probeImages(DINOS.map(d=>d.no),', 'probeImages([],', '그림 파일 찾기'),
  },
  {
    id: 'trace', src: '든든 따라쓰기.html',
    changes: ['글꼴 로컬', '사진→아바타', '이름→게임방 설정(기본 형·동생)'],
    fix: (h) => sanitizeKids(h, '따라 쓰기'),
  },
  {
    id: 'blocks', src: '든든 블록.html',
    changes: ['글꼴 로컬', '사진→아바타', '이름→게임방 설정(기본 형·동생)'],
    fix: (h) => sanitizeKids(h, '블록'),
  },
]

/* 2차(2026-11-22)부터 dino·trace·blocks 복사본은 public/legacy/<id>/index.html 을 직접 고침.
   덮어쓰지 않도록 파일이 이미 있으면 건너뜀 (처음부터 다시 만들려면: npm run legacy -- --force <id>) */
const FORCE = process.argv.includes('--force')
function buildHtmlGames() {
  for (const g of HTML_GAMES) {
    if (!want(g.id)) continue
    if (!FORCE && fs.existsSync(path.join(OUT, g.id, 'index.html'))) { console.log(`• public/legacy/${g.id}/ 는 직접 고친 복사본이라 건너뜀`); continue }
    let html = fs.readFileSync(path.join(LEGACY, g.src), 'utf8')
    html = commonHtml(html)
    html = g.fix(html)
    html = html.replace(/^<!doctype html>/i, (m) => m + '\n' + header(g.src, g.changes).trimEnd())
    const dir = path.join(OUT, g.id)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html)
    console.log(`✔ ${g.src} → public/legacy/${g.id}/index.html (${Math.round(html.length / 1024)}KB)`)
  }
}

/* ---------- Vite 게임 3개 ---------- */
const VITE_GAMES = [
  /* maeum-nalssi: 2단계로 옮김 (src/games/maeum-nalssi) → 더 이상 복사본을 만들지 않음 */
  /* hyeonga-rang, banjjak-habits: 2단계로 옮김 (src/games/...) → 더 이상 복사본을 만들지 않음 */
]

/** 복사본 안의 글자 바꾸기: 실명 → 형/동생, 아이 이름 로마자 id → 중립 id */
function neutral(text) {
  const cap = (s) => s[0].toUpperCase() + s.slice(1)
  for (const [r, word] of [['hyeong', '형'], ['dong', '동생']]) {
    for (const n of NAMES[r].ko) text = text.split(n).join(word)
    for (const n of NAMES[r].roman) {
      text = text.split(n.toUpperCase()).join(r.toUpperCase()).split(cap(n)).join(cap(r)).split(n).join(r)
    }
  }
  return text
}

function copyTree(from, to, transform) {
  fs.mkdirSync(to, { recursive: true })
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name)
    const b = path.join(to, neutral(e.name))
    if (e.isDirectory()) copyTree(a, b, transform)
    else if (/\.(tsx?|json|css|html|txt)$/.test(e.name)) fs.writeFileSync(b, transform(fs.readFileSync(a, 'utf8'), e.name))
    else fs.copyFileSync(a, b)
  }
}

/* 게임방에서 정한 이름·소리 크기를 게임 설정에 넣어 줌 (게임이 설정을 읽기 전에 실행) */
const ddSync = (key) => `/* 든든이 게임방 연결: 게임방 설정의 이름·소리 크기를 이 게임 설정에 반영 (build-legacy.mjs 가 넣음) */
try {
  const dd = JSON.parse(localStorage.getItem('dundeuni:settings') || 'null')
  if (dd) {
    const s = JSON.parse(localStorage.getItem('${key}') || '{}')
    const n = dd.names || {}
    if (n.hyeong && String(n.hyeong).trim()) s.hyeong = String(n.hyeong).trim()
    if (n.dong && String(n.dong).trim()) s.dongsaeng = String(n.dong).trim()
    if (typeof dd.volume === 'number') s.volume = dd.volume
    localStorage.setItem('${key}', JSON.stringify(s))
  }
} catch { /* 무시 */ }
export {}
`

function audioList(dir) {
  const id = 'virtual:audio-list'
  return {
    name: 'audio-list',
    resolveId: (s) => (s === id ? '\0' + id : undefined),
    load(s) {
      if (s !== '\0' + id) return
      let files = []
      try { files = fs.readdirSync(path.join(dir, 'public', 'audio')).filter((f) => /\.(mp3|m4a|wav|ogg)$/i.test(f)) } catch { /* 없음 */ }
      return 'export default ' + JSON.stringify(files)
    },
  }
}

async function buildViteGames() {
  for (const g of VITE_GAMES) {
    if (!want(g.id)) continue
    const src = path.join(LEGACY, g.src)
    const work = path.join(WORK, g.id)
    fs.rmSync(work, { recursive: true, force: true })
    copyTree(path.join(src, 'src'), path.join(work, 'src'), (t) => neutral(t))
    copyTree(path.join(src, 'public'), path.join(work, 'public'), (t) => neutral(t))
    /* 녹음 파일은 넣지 않음 (개인정보) */
    fs.rmSync(path.join(work, 'public', 'audio'), { recursive: true, force: true })
    fs.mkdirSync(path.join(work, 'public', 'audio'), { recursive: true })

    let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8')
    html = replaceOnce(html, '<title>', '<meta name="robots" content="noindex, nofollow" />\n    <link rel="stylesheet" href="../../fonts/jua.css" />\n    <title>', 'title')
    html = html.replace('<!doctype html>', '<!doctype html>\n' + header(g.src + '/', ['이름 기본값 형·동생', '중립 id', '게임별 PWA 제거', '공용 글꼴']).trimEnd())
    fs.writeFileSync(path.join(work, 'index.html'), neutral(html))

    const main = path.join(work, 'src', 'main.tsx')
    let m = fs.readFileSync(main, 'utf8')
    m = replaceOnce(m, "import '@fontsource/jua'\n", "import './ddSync'\n", 'main.tsx 글꼴')
    fs.writeFileSync(main, m)
    fs.writeFileSync(path.join(work, 'src', 'ddSync.ts'), ddSync(g.settingsKey))

    const out = path.join(OUT, g.id)
    await build({
      configFile: false,
      root: work,
      base: './',
      logLevel: 'warn',
      plugins: [react(), audioList(work)],
      /* 오래된 태블릿 브라우저에서도 돌게 (게임방 vite.config.ts 와 같은 기준) */
      build: { outDir: out, emptyOutDir: true, chunkSizeWarningLimit: 2000, target: ['es2019', 'chrome79', 'safari13', 'edge79', 'firefox78'] },
    })
    fs.rmSync(path.join(out, 'audio'), { recursive: true, force: true })
    console.log(`✔ legacy/${g.src}/ → public/legacy/${g.id}/`)
  }
}

/* ---------- 마무리 검사: 사진·실명이 복사본에 남지 않았는지 ---------- */
function verify() {
  /* .private-words.txt (커밋 검사와 같은 단어 목록) + 사진 */
  const wf = path.join(ROOT, '.private-words.txt')
  const words = fs.existsSync(wf) ? fs.readFileSync(wf, 'utf8').split(/\r?\n/).map((w) => w.trim()).filter(Boolean) : ALL_NAME_WORDS
  /* 영어 단어는 앞 글자가 알파벳이 아닐 때만 (예: 'cat' 은 잡고 'concat' 은 안 잡음) — check-privacy.sh 와 같은 규칙 */
  const rule = (w) => (/^[\w-]+$/.test(w) ? '(?<![A-Za-z])' + escRe(w) : escRe(w))
  const bad = new RegExp('data:image/jpeg|' + words.map(rule).join('|'), 'i')
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  for (const f of walk(OUT)) {
    if (!/\.(html|js|css|json)$/.test(f)) continue
    if (bad.test(fs.readFileSync(f, 'utf8'))) throw new Error('개인정보가 남아 있음: ' + path.relative(ROOT, f))
  }
  console.log('✔ 복사본 개인정보 검사 통과')
}

if (!fs.existsSync(LEGACY)) {
  console.error('legacy/ 폴더가 없어요. 원본 게임이 있는 PC에서 실행해 주세요.')
  process.exit(1)
}
if (want('fonts')) buildFonts()
buildHtmlGames()
await buildViteGames()
verify()

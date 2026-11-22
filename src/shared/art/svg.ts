/* 든든이 시리즈 오리지널 그림 (SVG 문자열). 출처: legacy/maeum-nalssi/src/components/Art.tsx 를 복사해 나눔 (2026-11-22)
   React 없이도 쓸 수 있어서 기존 HTML 게임 복사본을 만드는 스크립트에서도 사용 */

export const OUT = '#3B3651'
const PUPIL = '#2A2440'
const CHEEK = '#FF8AB8'

export const st = (w = 3) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
const E = (cx: number, cy: number, rx: number, ry: number, f: string, rot = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${st()}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`
const Ef = (cx: number, cy: number, rx: number, ry: number, f: string, op = 1) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" opacity="${op}"/>`
const P = (d: string, f: string, w = 3) => `<path d="${d}" fill="${f}" ${st(w)}/>`
const L = (d: string, c = OUT, w = 3) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

export type Mood = 'neutral' | 'happy' | 'joy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'upset' | 'sleepy'

/* 얼굴 표정: (x1,y)(x2,y) 두 눈 위치, r 눈 크기, my 입 위치 */
export function face(x1: number, x2: number, y: number, r: number, my: number, mood: Mood, cheeks = true) {
  const cx = (x1 + x2) / 2
  const dotEye = (x: number, rr = r) =>
    `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" ${st(2.5)}/><circle cx="${x + 0.6}" cy="${y + 0.6}" r="${rr * 0.58}" fill="${PUPIL}"/><circle cx="${x + 2}" cy="${y - 1.8}" r="${rr * 0.24}" fill="#fff"/>`
  const arcEye = (x: number) => L(`M${x - r} ${y + 1} Q${x} ${y - r * 1.3} ${x + r} ${y + 1}`, OUT, 3.2)
  const lidEye = (x: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${st(2.5)}/><circle cx="${x}" cy="${y + 1.5}" r="${r * 0.5}" fill="${PUPIL}"/>` +
    `<path d="M${x - r - 1} ${y - 0.5} A${r + 1} ${r + 1} 0 0 1 ${x + r + 1} ${y - 0.5} Z" fill="#E9E3F2" ${st(2.5)}/>`
  const brow = (x: number, tilt: number, lift = 0) => {
    const s = x < cx ? 1 : -1
    return L(`M${x - r} ${y - r - 4 - lift - tilt * s} L${x + r} ${y - r - 4 - lift + tilt * s}`, OUT, 3)
  }
  const ck = cheeks ? Ef(x1 - r * 0.6, y + r + 5, r * 0.85, r * 0.55, CHEEK, 0.55) + Ef(x2 + r * 0.6, y + r + 5, r * 0.85, r * 0.55, CHEEK, 0.55) : ''
  const w = r * 1.4
  let s = ''
  switch (mood) {
    case 'happy':
      s = arcEye(x1) + arcEye(x2) + ck + L(`M${cx - w} ${my - 2} Q${cx} ${my + w} ${cx + w} ${my - 2}`)
      break
    case 'joy':
      s = arcEye(x1) + arcEye(x2) + ck +
        P(`M${cx - w * 1.2} ${my - 3} Q${cx} ${my + w * 1.7} ${cx + w * 1.2} ${my - 3} Z`, '#7A3550', 2.5) +
        Ef(cx, my + w * 0.6, w * 0.6, w * 0.32, '#FF8FA8')
      break
    case 'sad':
      s = dotEye(x1) + dotEye(x2) + brow(x1, -3) + brow(x2, -3) +
        L(`M${cx - w} ${my + 5} Q${cx} ${my - w * 0.6} ${cx + w} ${my + 5}`) +
        `<path d="M${x1 - 1} ${y + r + 3} q-5 9 0 12 q5 -3 0 -12 Z" fill="#7EC4FF" stroke="#4E95D6" stroke-width="1.5"/>` +
        `<path d="M${x2 + 2} ${y + r + 3} q-5 9 0 12 q5 -3 0 -12 Z" fill="#7EC4FF" stroke="#4E95D6" stroke-width="1.5"/>`
      break
    case 'angry':
      s = dotEye(x1) + dotEye(x2) + brow(x1, 4) + brow(x2, 4) + ck.replace(/opacity="0.55"/g, 'opacity="0.8"') +
        L(`M${cx - w} ${my + 4} Q${cx} ${my - 3} ${cx + w} ${my + 4}`)
      break
    case 'scared':
      s = dotEye(x1, r * 1.15) + dotEye(x2, r * 1.15) + brow(x1, -2, 3) + brow(x2, -2, 3) +
        L(`M${cx - w} ${my + 2} q${w / 2} -4 ${w / 2} 0 t${w / 2} 0 t${w / 2} 0 t${w / 2} 0`) +
        `<path d="M${x2 + r + 8} ${y - r - 6} q-4 7 0 9 q4 -2 0 -9 Z" fill="#BFE6FF" stroke="#7AB6E0" stroke-width="1.5"/>`
      break
    case 'surprised':
      s = dotEye(x1, r * 1.2) + dotEye(x2, r * 1.2) + brow(x1, 0, 6) + brow(x2, 0, 6) + ck +
        E(cx, my + 3, w * 0.55, w * 0.7, '#7A3550')
      break
    case 'upset':
      s = lidEye(x1) + lidEye(x2) + brow(x1, -2) + brow(x2, -2) +
        L(`M${cx - w} ${my + 3} Q${cx - w / 2} ${my - 1} ${cx} ${my + 2} Q${cx + w / 2} ${my - 1} ${cx + w} ${my + 3}`)
      break
    case 'sleepy':
      s = L(`M${x1 - r} ${y} Q${x1} ${y + r} ${x1 + r} ${y}`) + L(`M${x2 - r} ${y} Q${x2} ${y + r} ${x2 + r} ${y}`) + ck +
        L(`M${cx - w * 0.5} ${my} Q${cx} ${my + 3} ${cx + w * 0.5} ${my}`)
      break
    default:
      s = dotEye(x1) + dotEye(x2) + ck + L(`M${cx - w * 0.8} ${my} Q${cx} ${my + w * 0.7} ${cx + w * 0.8} ${my}`)
  }
  return s
}

/* ---------- 그림 공통 (2차): 부드러운 외곽선 · 그라데이션 · 하이라이트 · 그림자 ----------
   외곽선을 검정 대신 몸 색을 진하게 한 색으로, 몸은 위쪽이 밝은 그라데이션 → 더 자연스럽고 말랑해 보이게 */
function hexToRgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
/** k < 0 이면 어둡게, k > 0 이면 밝게 */
export function shade(h: string, k: number) {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))
  return '#' + hexToRgb(h).map((v) => f(v).toString(16).padStart(2, '0')).join('')
}
const gradId = (b: string) => 'ddg' + b.slice(1).toLowerCase()
/** 같은 색이면 같은 id 라서 화면에 여러 개 있어도 문제없음 */
const grad = (b: string) =>
  `<defs><radialGradient id="${gradId(b)}" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="${shade(b, 0.38)}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${shade(b, -0.1)}"/></radialGradient></defs>`
const fillOf = (b: string) => `url(#${gradId(b)})`
const so = (o: string, w = 3) => `stroke="${o}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
const Eo = (cx: number, cy: number, rx: number, ry: number, f: string, o: string, rot = 0, w = 3) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${so(o, w)}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`
const Po = (d: string, f: string, o: string, w = 3) => `<path d="${d}" fill="${f}" ${so(o, w)}/>`
const Lo = (d: string, c: string, w = 3) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
const limbO = (d: string, c: string, o: string, w: number) => Lo(d, o, w + 5) + Lo(d, c, w)
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -24, op = 0.5) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`
const groundShadow = (cx: number, cy: number, rx: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.16}" fill="#1F2A44" opacity=".09"/>`

/* ---------- 든든이 (초록 아기 공룡) ---------- */
const DUN = { b: '#7DD08A', d: '#5BB56B', l: '#EAF9E0', h: '#FFC93C' }
export function dundunSVG(mood: Mood = 'neutral', wave = false) {
  const p = DUN
  const o = shade(p.b, -0.55)
  const f = fillOf(p.b)
  const ho = shade(p.h, -0.42)
  const spike = (x: number, y: number, h: number, tilt = 0) => Po(`M${x - 10} ${y + 10} Q${x + tilt} ${y - h} ${x + 10} ${y + 10} Z`, p.h, ho, 2.5)
  return (
    grad(p.b) +
    groundShadow(100, 153, 52) +
    Po('M62 116 Q30 128 8 104 Q34 110 66 98 Z', f, o) +
    spike(40, 106, 8, -4) + spike(62, 92, 12, -3) + spike(80, 76, 14, -2) +
    Eo(96, 108, 44, 38, f, o) + Ef(104, 119, 26, 22, p.l) +
    Eo(78, 146, 15, 8, p.d, o) + Eo(118, 146, 15, 8, p.d, o) +
    (wave ? limbO('M130 106 q14 -10 16 -28', p.b, o, 8) : limbO('M128 112 q10 2 12 10', p.b, o, 8)) +
    spike(98, 34, 14, -2) + spike(116, 25, 16) + spike(136, 27, 14, 2) +
    Eo(124, 62, 40, 34, f, o) +
    shine(108, 42, 13, 6) + shine(80, 90, 11, 5, -30, 0.35) +
    face(110, 140, 58, 8.5, 77, mood)
  )
}

/* ---------- 친구들 + 어른들 ----------
   어른(엄마·아빠·선생님·할아버지·할머니)은 동물 친구 모양에 소품(안경·리본·넥타이·수염·머리 쪽)을 더해 구분 */
export type BaseKind = 'bear' | 'bunny' | 'chick' | 'cat' | 'puppy'
export type AdultKind = 'mom' | 'dad' | 'teacher' | 'grandpa' | 'grandma'
export type Kind = BaseKind | AdultKind
type Col = { b: string; d: string; l: string }
export const KIND_COLORS: Record<Kind, Col> = {
  bear: { b: '#9CCBF2', d: '#6EA6DA', l: '#E3F1FC' },
  bunny: { b: '#C6E58A', d: '#9CC35A', l: '#F0F9DC' },
  chick: { b: '#FBDD72', d: '#E5BC3E', l: '#FFF6D2' },
  cat: { b: '#F6B4CF', d: '#DE86AC', l: '#FDE6F0' },
  puppy: { b: '#E2BE94', d: '#C29765', l: '#F7E8D6' },
  mom: { b: '#F7BACB', d: '#E290A7', l: '#FDE9EF' },
  dad: { b: '#A9C3E6', d: '#7E9DCB', l: '#E7EFFA' },
  teacher: { b: '#CDB6F2', d: '#A68BDB', l: '#EFE7FC' },
  grandpa: { b: '#DCCAB2', d: '#B9A386', l: '#F5EEE4' },
  grandma: { b: '#EAD8EE', d: '#C9AECF', l: '#F9F2FA' },
}
const ADULT_BASE: Record<AdultKind, BaseKind> = { mom: 'cat', dad: 'bear', teacher: 'bunny', grandpa: 'puppy', grandma: 'bunny' }
export const isAdult = (k: Kind): k is AdultKind => k in ADULT_BASE
export const PALETTE: Record<string, Col> = {
  sky: { b: '#9CCBF2', d: '#6EA6DA', l: '#E3F1FC' },
  lime: { b: '#C6E58A', d: '#9CC35A', l: '#F0F9DC' },
  pink: { b: '#F6B4CF', d: '#DE86AC', l: '#FDE6F0' },
  yellow: { b: '#FBDD72', d: '#E5BC3E', l: '#FFF6D2' },
  purple: { b: '#CDB6F2', d: '#A68BDB', l: '#EFE7FC' },
  orange: { b: '#F9C08A', d: '#E59A55', l: '#FDEBD8' },
}

const glasses = (y = 50) =>
  `<g fill="rgba(255,255,255,.28)" stroke="#5B4636" stroke-width="2.6"><circle cx="46" cy="${y}" r="11"/><circle cx="74" cy="${y}" r="11"/></g>` +
  Lo(`M57 ${y} q3 -3 6 0`, '#5B4636', 2.6)

function adultExtras(k: AdultKind, c: Col, o: string) {
  switch (k) {
    case 'mom': /* 머리 리본 + 목걸이 */
      return Po('M60 14 L42 4 L44 26 Z', '#FF8FB1', '#C9577D', 2.5) + Po('M60 14 L78 4 L76 26 Z', '#FF8FB1', '#C9577D', 2.5) +
        `<circle cx="60" cy="15" r="6" fill="#FFB3CA" stroke="#C9577D" stroke-width="2.5"/>` +
        [44, 52, 60, 68, 76].map((x, i) => `<circle cx="${x}" cy="${92 + Math.abs(i - 2) * -1.5 + 2}" r="3.2" fill="#fff" stroke="${o}" stroke-width="1.2"/>`).join('')
    case 'dad': /* 안경 + 넥타이 */
      return glasses() + Po('M56 88 L64 88 L66 94 L60 118 L54 94 Z', '#5B7BD0', '#34508F', 2.5) + Po('M55 86 L65 86 L63 92 L57 92 Z', '#6E8EE0', '#34508F', 2)
    case 'teacher': /* 안경 + 가슴의 별 이름표 */
      return glasses() + `<rect x="66" y="96" width="18" height="12" rx="3" fill="#fff" stroke="${o}" stroke-width="2"/>` +
        Po('M75 98 l1.6 3.2 3.4 .4 -2.5 2.3 .7 3.4 -3.2 -1.7 -3.2 1.7 .7 -3.4 -2.5 -2.3 3.4 -.4 Z', '#FFC93C', '#C99A1E', 1)
    case 'grandpa': /* 하얀 눈썹·콧수염 + 안경 */
      return glasses(52) + Lo('M36 36 q8 -5 16 0 M68 36 q8 -5 16 0', '#FFFFFF', 5) +
        Po('M44 72 Q52 64 60 70 Q68 64 76 72 Q68 78 60 74 Q52 78 44 72 Z', '#FFFFFF', '#B9A386', 2)
    case 'grandma': /* 회색 머리 쪽 + 안경 + 진주 목걸이 */
      return `<circle cx="60" cy="10" r="13" fill="#E4E4EA" stroke="#A9A9B6" stroke-width="2.5"/>` + Lo('M52 8 q8 -6 16 0', '#C9C9D3', 2) +
        glasses() + [46, 53, 60, 67, 74].map((x) => `<circle cx="${x}" cy="94" r="3" fill="#FFFDF5" stroke="#C9AECF" stroke-width="1.2"/>`).join('')
  }
}

export function friendSVG(kind: Kind, mood: Mood = 'neutral', color?: Col, wave = false) {
  const base: BaseKind = isAdult(kind) ? ADULT_BASE[kind] : kind
  const c = color || KIND_COLORS[kind]
  const o = shade(c.b, -0.52)
  const f = fillOf(c.b)
  let ears = ''
  let extra = ''
  if (base === 'bear') ears = Eo(28, 24, 14, 14, f, o) + Ef(28, 25, 7, 7, c.l) + Eo(92, 24, 14, 14, f, o) + Ef(92, 25, 7, 7, c.l)
  if (base === 'bunny') ears = Eo(42, 6, 11, 28, f, o, -8) + Ef(42, 9, 5, 19, '#FFD3E2') + Eo(78, 6, 11, 28, f, o, 8) + Ef(78, 9, 5, 19, '#FFD3E2')
  if (base === 'cat') ears = Po('M22 38 Q24 10 30 4 Q44 14 54 22 Z', f, o) + Po('M98 38 Q96 10 90 4 Q76 14 66 22 Z', f, o) +
    Po('M28 28 L31 12 L42 20 Z', '#FFD3E2', 'none', 0) + Po('M92 28 L89 12 L78 20 Z', '#FFD3E2', 'none', 0)
  if (base === 'puppy') ears = Eo(22, 48, 12, 24, c.d, o, 16) + Eo(98, 48, 12, 24, c.d, o, -16)
  if (base === 'chick') ears = Lo('M58 16 q-6 -12 4 -14 M62 16 q4 -12 12 -8', o, 3)
  if (base === 'chick') extra = Po('M52 66 Q60 76 68 66 Q60 62 52 66 Z', '#FFA64D', '#D9782A', 2.2)
  if (base === 'bear' || base === 'puppy') extra = Ef(60, 66, 13, 9, c.l, 1) + `<ellipse cx="60" cy="62" rx="5.5" ry="4" fill="${PUPIL}"/>`
  const armL = wave ? limbO('M30 100 q-16 -10 -18 -28', c.b, o, 9) : limbO('M32 102 q-10 8 -8 18', c.b, o, 9)
  const armR = limbO('M88 102 q10 8 8 18', c.b, o, 9)
  return (
    grad(c.b) +
    groundShadow(60, 144, 36) +
    Eo(44, 136, 13, 7, c.d, o) + Eo(76, 136, 13, 7, c.d, o) +
    armL + armR +
    Eo(60, 110, 31, 26, f, o) + Ef(60, 116, 18, 15, c.l) +
    ears +
    Eo(60, 52, 41, 37, f, o) +
    shine(44, 32, 13, 6) +
    extra +
    face(46, 74, 50, 7, base === 'chick' ? 80 : 70, mood) +
    (isAdult(kind) ? adultExtras(kind, c, o) : '')
  )
}

/* ---------- 날씨 아이콘 ---------- */
export type Weather = 'sun' | 'rain' | 'thunder' | 'fog' | 'rainbow' | 'cloud'
const cloud = (f: string, dx = 0, dy = 0, s = 1) =>
  `<path transform="translate(${dx} ${dy}) scale(${s})" d="M26 72 Q10 72 11 58 Q12 45 27 46 Q29 29 48 29 Q63 29 67 42 Q81 38 87 51 Q95 54 93 63 Q91 72 80 72 Z" fill="${f}" ${st(3)}/>`

export function weatherSVG(w: Weather) {
  switch (w) {
    case 'sun':
      return (
        Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return L(`M${50 + Math.cos(a) * 30} ${50 + Math.sin(a) * 30} L${50 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42}`, '#F2B92B', 6)
        }).join('') +
        `<circle cx="50" cy="50" r="22" fill="#FFD84D" ${st(3)}/>` +
        L('M42 46 L42 47 M58 46 L58 47', OUT, 5) + L('M43 55 Q50 61 57 55', OUT, 3) +
        Ef(38, 54, 4, 2.6, CHEEK, 0.6) + Ef(62, 54, 4, 2.6, CHEEK, 0.6)
      )
    case 'rain':
      return cloud('#A9C9EE') +
        [24, 46, 68].map((x, i) => `<path d="M${x} ${80 + (i % 2) * 4} q-5 9 0 12 q5 -3 0 -12 Z" fill="#6FB2F5" stroke="#3D86D1" stroke-width="2"/>`).join('')
    case 'thunder':
      return cloud('#B7B3D6', 0, -6) + P('M52 62 L40 84 L52 84 L44 100 L66 76 L54 76 L62 62 Z', '#FFD84D', 2.5)
    case 'fog':
      return cloud('#D9CCF3', 0, -10) +
        [70, 81, 92].map((y, i) => L(`M${14 + i * 4} ${y} q10 -6 20 0 t20 0 t20 0 t16 0`, '#9F86D6', 5)).join('')
    case 'rainbow':
      return ['#FF9A8C', '#FFC36B', '#FFE27A', '#9EDB8E', '#8EC5F5', '#BBA2EE']
        .map((c, i) => L(`M${12 + i * 5.5} 78 A${38 - i * 5.5} ${38 - i * 5.5} 0 0 1 ${88 - i * 5.5} 78`, c, 6))
        .join('') +
        cloud('#FFFFFF', -2, 40, 0.45) + cloud('#FFFFFF', 58, 40, 0.45)
    case 'cloud':
      return cloud('#D4D9E3', 0, 4) + L('M40 58 L40 59 M58 58 L58 59', OUT, 5) + L('M42 68 Q49 64 56 68', OUT, 3)
  }
}

export const CUSTOM_ICONS: Record<string, string> = {
  toothbrush:
    `<rect x="44" y="34" width="12" height="60" rx="6" fill="#7EC4FF" ${st(3.5)} transform="rotate(30 50 64)"/>` +
    `<rect x="40" y="8" width="20" height="30" rx="5" fill="#FFFFFF" ${st(3.5)} transform="rotate(30 50 64)"/>` +
    `<path d="M45 14 V32 M50 14 V32 M55 14 V32" stroke="#7EC4FF" stroke-width="3" stroke-linecap="round" transform="rotate(30 50 64)"/>`,
  towel:
    `<rect x="18" y="14" width="64" height="74" rx="10" fill="#9FD3F5" ${st(4)}/>` +
    '<path d="M18 30 H82 M18 72 H82" stroke="#fff" stroke-width="6"/>' +
    `<rect x="10" y="8" width="80" height="12" rx="6" fill="#C9A35E" ${st(4)}/>`,
  bubble:
    `<circle cx="42" cy="56" r="28" fill="rgba(190,225,255,.55)" ${st(3)}/><circle cx="74" cy="30" r="16" fill="rgba(255,210,240,.55)" ${st(3)}/>` +
    '<path d="M28 46 Q32 36 42 34" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="70" cy="25" r="3.5" fill="#fff"/>',
  slide:
    `<path d="M14 90 L70 30 L84 30 L84 90" fill="none" stroke="#3B3651" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M16 88 L70 30 L80 36 L28 92 Z" fill="#FFB86B" ${st(3)}/>` +
    `<path d="M72 30 V90 M84 30 V90 M72 46 H84 M72 62 H84 M72 78 H84" stroke="#3B3651" stroke-width="4" stroke-linecap="round"/>`,
}

/* ---------- 게임방에서 새로 그린 그림 ---------- */

/** 완성된 <svg> 문자열 (HTML 게임 복사본의 사진 대신 쓰는 아바타 등) */
export function svgDoc(inner: string, viewBox: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`
}
export const svgDataURI = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

/** 아바타 (동물 + 색) — 동그란 바탕 안에 */
export function avatarSVG(kind: Kind, color?: { b: string; d: string; l: string }, mood: Mood = 'happy') {
  const c = color || KIND_COLORS[kind]
  return svgDoc(`<circle cx="60" cy="63" r="80" fill="${c.l}"/>` + friendSVG(kind, mood, c), '-20 -17 160 160')
}

const g = (x: number, y: number, s: number, inner: string) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`

/** 메인 화면 게임 카드 그림 (viewBox 0 0 200 160) */
export const GAME_ART: Record<string, () => string> = {
  dino: () =>
    `<path d="M0 132 Q50 104 100 124 T200 118 V160 H0 Z" fill="#B9E3A5"/>` +
    `<path d="M150 40 q14 -26 30 -10 q-18 -2 -24 16 q22 -6 26 12 q-16 -8 -30 0 Z" fill="#7CC36B" ${st(2.5)}/>` +
    `<path d="M156 48 L152 130" stroke="#A8744A" stroke-width="7" stroke-linecap="round"/>` +
    g(-6, 10, 0.92, dundunSVG('happy', true)),
  trace: () =>
    `<rect x="22" y="18" width="116" height="124" rx="16" fill="#fff" ${st(3)}/>` +
    `<path d="M48 54 H108 V118" fill="none" stroke="#DDE7EF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M48 54 H108 V86" fill="none" stroke="#2F7DE1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="48" cy="54" r="7" fill="#E8483B"/>` +
    `<g transform="rotate(35 150 90)"><rect x="140" y="30" width="22" height="90" rx="5" fill="#FFCB2F" ${st(3)}/>` +
    `<path d="M140 120 L151 142 L162 120 Z" fill="#F7D9B0" ${st(3)}/><path d="M147 134 L151 142 L155 134 Z" fill="${OUT}"/>` +
    `<rect x="140" y="22" width="22" height="14" rx="4" fill="#FF8AB8" ${st(3)}/></g>`,
  blocks: () => {
    const blk = (x: number, y: number, f: string) => `<rect x="${x}" y="${y}" width="34" height="34" rx="7" fill="${f}" ${st(3)}/>`
    const eyes = (x: number, y: number) => `<circle cx="${x + 11}" cy="${y + 14}" r="3" fill="${OUT}"/><circle cx="${x + 23}" cy="${y + 14}" r="3" fill="${OUT}"/><path d="M${x + 11} ${y + 22} q6 5 12 0" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`
    return (
      `<path d="M10 146 H190" stroke="#98BC8C" stroke-width="6" stroke-linecap="round"/>` +
      blk(26, 110, '#FF9A8C') + eyes(26, 110) +
      blk(80, 110, '#FFE27A') + blk(80, 76, '#FFE27A') + eyes(80, 76) +
      blk(134, 110, '#8EC5F5') + blk(134, 76, '#8EC5F5') + blk(134, 42, '#8EC5F5') + eyes(134, 42) +
      `<text x="43" y="98" font-size="22" text-anchor="middle" fill="${OUT}" font-family="Jua, sans-serif">1</text>` +
      `<text x="97" y="64" font-size="22" text-anchor="middle" fill="${OUT}" font-family="Jua, sans-serif">2</text>` +
      `<text x="151" y="30" font-size="22" text-anchor="middle" fill="${OUT}" font-family="Jua, sans-serif">3</text>`
    )
  },
  'maeum-nalssi': () =>
    g(96, 0, 0.95, weatherSVG('sun')) + g(10, 54, 0.8, weatherSVG('rain')) +
    g(62, 44, 0.62, friendSVG('chick', 'happy')),
  'hyeonga-rang': () =>
    `<path d="M82 34 q18 -22 36 0 q-18 14 -36 0 Z" fill="#FF8AB8" ${st(2.5)}/>` +
    g(4, 30, 0.78, friendSVG('bear', 'joy', undefined, true)) +
    g(96, 30, 0.78, friendSVG('bunny', 'joy')),
  'banjjak-habits': () =>
    g(18, 30, 1.05, CUSTOM_ICONS.toothbrush) + g(90, 40, 0.95, CUSTOM_ICONS.bubble) +
    `<path d="M160 22 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6 Z" fill="#FFD84D" ${st(2.5)}/>` +
    `<path d="M40 18 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" fill="#FFD84D" ${st(2)}/>`,
}

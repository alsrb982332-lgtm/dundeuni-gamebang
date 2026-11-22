import { recordingURL } from './recordings'

/* 게임방 공통 목소리 안내
   1순위: 부모 설정에서 녹음한 목소리 (이 기기 IndexedDB)
   2순위: 브라우저 읽어주기(TTS) — 한국어(ko-KR), 속도 0.85, 조금 높은 톤
   문장은 이름표(key)로 부르고, {이름} {형} {동생} 자리표시자를 지원 (조사 자동: {형이} → 「형이」/「민수가」)
   출처: legacy/maeum-nalssi/src/hooks/useVoice.ts 를 옮겨 와 녹음 방식을 IndexedDB 로 바꿈 (2026-11-22) */

const LINES: Record<string, string> = {}
let volume = 1
let vars: Record<string, string> = {}

const GROUPS = new Map<string, string[]>()

/** 게임마다 문장 모음(voice.json)을 등록. 이름표가 겹치면 나중 것이 우선. group 은 부모 녹음 화면의 묶음 이름 */
export function registerLines(lines: Record<string, string>, group = '게임방') {
  Object.assign(LINES, lines)
  GROUPS.set(group, [...new Set([...(GROUPS.get(group) || []), ...Object.keys(lines)])])
}
export const allLines = () => ({ ...LINES })
/** 부모 녹음 화면용: [묶음 이름, [이름표, 문장][]][] */
export const voiceGroups = () => [...GROUPS.entries()].map(([g, keys]) => [g, keys.map((k) => [k, LINES[k]] as [string, string])] as const)

/* ---------- 이름 자리표시자 + 조사 ---------- */
const PAIRS: [string, string][] = [
  ['이', '가'], ['은', '는'], ['을', '를'], ['과', '와'], ['아', '야'],
  ['이랑', '랑'], ['이야', '야'], ['이에요', '예요'], ['으로', '로'], ['이나', '나'],
]
export function hasBatchim(word: string) {
  const c = word.charCodeAt(word.length - 1) - 0xac00
  return c >= 0 && c <= 11171 && c % 28 !== 0
}
export function josa(word: string, tail: string) {
  const p = PAIRS.find(([a, b]) => a === tail || b === tail)
  if (!p) return word + tail
  return word + (hasBatchim(word) ? p[0] : p[1])
}
export function fill(text: string, extra?: Record<string, string>) {
  const all = { ...vars, ...extra }
  const keys = Object.keys(all).sort((a, b) => b.length - a.length)
  return text.replace(/\{([^{}]+)\}/g, (m, inner: string) => {
    for (const k of keys) {
      if (inner === k) return all[k]
      if (inner.startsWith(k)) return josa(all[k], inner.slice(k.length))
    }
    return m
  })
}

export function line(key: string, extra?: Record<string, string>) {
  return fill(LINES[key] ?? key, extra)
}

/* ---------- 읽어주기(TTS) ---------- */
let voices: SpeechSynthesisVoice[] = []
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window
function loadVoices() {
  try { voices = speechSynthesis.getVoices() || [] } catch { /* 무시 */ }
}
if (hasTTS) {
  loadVoices()
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices) } catch { /* 무시 */ }
}
function koVoice() {
  if (!voices.length) loadVoices()
  const n = (v: SpeechSynthesisVoice) => (v.lang || '').replace('_', '-').toLowerCase()
  return voices.find((v) => n(v) === 'ko-kr') || voices.find((v) => n(v).startsWith('ko')) || null
}
export const hasKoreanVoice = () => !!koVoice()

const clean = (t: string) => t.replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/~/g, '').trim()

let clip: HTMLAudioElement | null = null
let finishCurrent: (() => void) | null = null

export function stopVoice() {
  try { if (hasTTS) speechSynthesis.cancel() } catch { /* 무시 */ }
  if (clip) {
    try { clip.pause() } catch { /* 무시 */ }
    clip = null
  }
  const f = finishCurrent
  finishCurrent = null
  f?.()
}

function speakTTS(text: string): Promise<void> {
  return new Promise((res) => {
    let done = false
    const fin = () => { if (!done) { done = true; if (finishCurrent === fin) finishCurrent = null; res() } }
    finishCurrent = fin
    const t = clean(text)
    if (!t || volume <= 0) return fin()
    setTimeout(fin, Math.min(25000, 1800 + t.length * 210))
    if (!hasTTS) return void setTimeout(fin, 500 + t.length * 120)
    try {
      const ss = speechSynthesis
      try { ss.cancel() } catch { /* 무시 */ }
      try { ss.resume() } catch { /* 무시 */ }
      let started = false
      const mk = () => {
        const u = new SpeechSynthesisUtterance(t)
        u.lang = 'ko-KR'
        const v = koVoice()
        if (v) u.voice = v
        u.rate = 0.85
        u.pitch = 1.2
        u.volume = volume
        u.onstart = () => { started = true }
        u.onend = fin
        u.onerror = (e) => { if (started || (e.error !== 'interrupted' && e.error !== 'canceled')) fin() }
        return u
      }
      ss.speak(mk())
      /* 안드로이드 크롬에서 가끔 첫 마디가 안 나오는 문제 대비: 한 번 더 시도 */
      setTimeout(() => {
        if (done || started || ss.speaking) return
        try { ss.cancel(); ss.resume() } catch { /* 무시 */ }
        ss.speak(mk())
      }, 700)
    } catch {
      fin()
    }
  })
}

function playURL(url: string, fallbackText: string): Promise<void> {
  return new Promise((res) => {
    let done = false
    const fin = () => { if (!done) { done = true; if (finishCurrent === fin) finishCurrent = null; res() } }
    finishCurrent = fin
    try {
      const a = new Audio(url)
      a.volume = volume
      clip = a
      a.onended = fin
      a.onerror = () => { clip = null; finishCurrent = null; speakTTS(fallbackText).then(fin) }
      setTimeout(fin, 20000)
      a.play().catch(() => { clip = null; finishCurrent = null; speakTTS(fallbackText).then(fin) })
    } catch {
      speakTTS(fallbackText).then(fin)
    }
  })
}

/** 이름표(key)로 말하기. text 를 주면 등록된 문장 대신 그 문장을 읽음 (녹음은 같은 이름표로 찾음) */
export function say(key: string, opts?: { text?: string; vars?: Record<string, string> }): Promise<void> {
  stopVoice()
  if (volume <= 0) return Promise.resolve()
  const text = fill(opts?.text ?? LINES[key] ?? key, opts?.vars)
  const url = recordingURL(key)
  return url ? playURL(url, text) : speakTTS(text)
}

/** 이름표 없이 문장 그대로 읽기 */
export const sayText = (text: string) => say('__text__', { text })

export function setVoiceVolume(v: number) { volume = v }
export function setVoiceVars(v: Record<string, string>) { vars = v }
export const voiceVars = () => ({ ...vars })

export function useVoice() {
  return { say, sayText, stopVoice, line, fill }
}

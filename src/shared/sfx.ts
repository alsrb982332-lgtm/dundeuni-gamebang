/* 부드러운 효과음 (파일 없이 소리를 직접 만들어 냄). 큰 소리·버저 소리는 쓰지 않음 */
let ac: AudioContext | null = null
let master: GainNode | null = null
let volume = 0.8

function ctx(): AudioContext | null {
  try {
    if (!ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ac = new AC()
      master = ac.createGain()
      master.gain.value = volume
      master.connect(ac.destination)
    }
    if (ac.state === 'suspended') void ac.resume()
    return ac
  } catch {
    return null
  }
}

export function setSfxVolume(v: number) {
  volume = v
  if (master) master.gain.value = v
}

/* iOS·안드로이드는 첫 터치 때 소리를 깨워 둬야 함 */
let unlocked = false
export function unlockAudio() {
  const c = ctx()
  if (c && !unlocked) {
    try {
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(master!)
      s.start(0)
      unlocked = true
    } catch { /* 무시 */ }
  }
  try {
    if ('speechSynthesis' in window && !unlocked) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      speechSynthesis.speak(u)
    }
  } catch { /* 무시 */ }
}

function tone(f: number, d = 0.15, type: OscillatorType = 'sine', v = 0.14, when = 0, slideTo?: number) {
  const c = ctx()
  if (!c || volume <= 0) return
  const t = c.currentTime + when
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(v, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + d + 0.03)
}

let noiseBuf: AudioBuffer | null = null
function noise(d = 0.1, v = 0.08, when = 0, freq = 2000, q = 1, type: BiquadFilterType = 'bandpass') {
  const c = ctx()
  if (!c || volume <= 0) return
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const ch = noiseBuf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
  }
  const t = c.currentTime + when
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(v, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  s.connect(f).connect(g).connect(master!)
  s.start(t, Math.random() * 0.5)
  s.stop(t + d + 0.03)
}

export const sfx = {
  /** 띠링 */
  ding() { tone(880, 0.18, 'sine', 0.12); tone(1320, 0.28, 'sine', 0.09, 0.09) },
  /** 뽀옹 */
  boing() { tone(330, 0.22, 'sine', 0.13, 0, 660) },
  /** 톡 (누를 때) */
  pop() { tone(620, 0.07, 'triangle', 0.08) },
  /** 부드러운 '음~' (다시 생각해 보자) */
  hmm() { tone(392, 0.25, 'sine', 0.07); tone(349, 0.3, 'sine', 0.06, 0.18) },
  /** 반짝 */
  sparkle() { [1568, 1976, 2349, 2637].forEach((f, i) => tone(f, 0.16, 'sine', 0.05, i * 0.07)) },
  /** 축하 (작고 부드럽게) */
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.26, 'sine', 0.1, i * 0.12)) },
  /** 짝! (하이파이브) */
  clap() { noise(0.12, 0.25, 0, 1800, 0.8); noise(0.08, 0.15, 0.02, 3000, 1) },
  /** 쿵 (블록 놓기) */
  thunk() { tone(180, 0.16, 'triangle', 0.14, 0, 110); noise(0.05, 0.05, 0, 600, 1) },
  /** 슝 */
  whoosh() { noise(0.35, 0.06, 0, 900, 0.7) },
  /** 치카치카 */
  chika() { for (let i = 0; i < 6; i++) noise(0.07, 0.07, i * 0.13, 4200, 2) },
  /** 쏴아 (물) */
  water() { noise(1.0, 0.07, 0, 1400, 0.4, 'lowpass') },
  /** 뽀글뽀글 (거품) */
  bubble() { for (let i = 0; i < 6; i++) tone(500 + Math.random() * 500, 0.08, 'sine', 0.06, i * 0.09, 900 + Math.random() * 600) },
  /** 냠냠 */
  nyam() { [0, 0.28].forEach((w) => { tone(300, 0.1, 'triangle', 0.09, w, 240); tone(260, 0.1, 'triangle', 0.08, w + 0.12, 200) }) },
  /** 쓱쓱 */
  sseuk() { noise(0.18, 0.08, 0, 2500, 0.6); noise(0.18, 0.08, 0.26, 2200, 0.6) },
  /** 딸깍 (상자·뚜껑) */
  click() { tone(1400, 0.04, 'square', 0.04); tone(900, 0.05, 'square', 0.03, 0.05) },
}

export type SfxName = keyof typeof sfx
export const playSfx = (n?: string) => { if (n && n in sfx) sfx[n as SfxName]() }

/* 노래: 음 높이 배열을 박자에 맞춰 연주 (오리지널 멜로디만 사용) */
export function playMelody(notes: (number | 0)[], beat = 0.32, v = 0.07) {
  notes.forEach((f, i) => { if (f) tone(f, beat * 0.9, 'triangle', v, i * beat) })
  return notes.length * beat * 1000
}

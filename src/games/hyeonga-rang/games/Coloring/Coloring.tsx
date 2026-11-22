import { cx } from '../../cx'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPE, type ReactNode } from 'react'
import DATA from '../../data/pictures.json'
import { SplitScreen, type PlayCtx } from '../../components/SplitScreen'
import { useKeyboardPress, type Press } from '../../useMultiTouch'
import type { Role } from '../../progress'
import { say } from '../../../../shared/useVoice'
import { useAlive } from '../../../../shared/useAlive'
import { sfx } from '../../../../shared/sfx'
import { pick, sleep } from '../../../../shared/storage'

/* 같이 색칠하기 — 형 색과 동생 색이 모두 있어야 그림이 완성됨.
   내 색을 고르고 칸을 손가락으로 쓱쓱 문지르면 색이 채워짐 (대충 3~4번 문지르면 다 칠해짐)
   동생은 자기 구역 아무 데나 눌러도 자기 색 칸이 칠해짐 (넉넉한 판정) */
type Region = { name: string; color: string; d: string }
type Picture = { id: string; name: string; icon: string; hyeong: string[]; dong: string[]; regions: Region[]; deco?: string }
const COLORS = DATA.colors as Record<string, { name: string; hex: string }>
const PICS = DATA.pictures as Picture[]

/** 문지른 길이가 칸 크기의 이만큼(배)이 되면 다 칠해짐 ≈ 3~4번 쓱쓱 */
export const RUB_FACTOR = 2.4
export const rubNeed = (w: number, h: number) => Math.max(160, Math.max(w, h) * RUB_FACTOR)

export function Coloring({ ctx, onWin, header }: { ctx: PlayCtx; onWin: () => void; header: ReactNode }) {
  const alive = useAlive()
  const pic = useMemo(() => pick(PICS), [])
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), [])
  const own = (r: Role) => (r === 'hyeong' ? pic.hyeong : pic.dong)
  const ownerOf = (c: string): Role => (pic.dong.includes(c) ? 'dong' : 'hyeong')
  const [painted, setPainted] = useState<boolean[]>(() => pic.regions.map(() => false))
  const paintedRef = useRef(painted)
  const [sel, setSel] = useState<Record<Role, string>>({ hyeong: '', dong: '' })
  const active = useRef<{ role: Role; color: string } | null>(null)
  const [glowColor, setGlowColor] = useState<string | null>(null)
  const [pop, setPop] = useState(-1)
  const [done, setDone] = useState(false)
  const nagAt = useRef(0)

  /* 문지르기 */
  const svgRef = useRef<SVGSVGElement>(null)
  const strokes = useRef<string[][]>(pic.regions.map(() => []))
  const progress = useRef<number[]>(pic.regions.map(() => 0))
  const rub = useRef<{ i: number; id: number; x: number; y: number; need: number; soundAt: number } | null>(null)
  const [, setTick] = useState(0)
  const redraw = () => setTick((t) => t + 1)

  function nag(key: string, vars?: Record<string, string>) {
    const now = performance.now()
    if (now - nagAt.current < 1800) return
    nagAt.current = now
    say(key, { vars })
  }

  async function paint(i: number) {
    if (paintedRef.current[i]) return
    const next = paintedRef.current.map((v, k) => v || k === i)
    paintedRef.current = next
    setPainted(next)
    setPop(i)
    setGlowColor(null)
    sfx.bubble()
    if (next.every(Boolean)) {
      setDone(true)
      await sleep(700)
      sfx.sparkle()
      await say('color_done')
      if (alive()) onWin()
    } else if (Math.random() < 0.4) say('color_ok')
  }

  /* 이 색이 필요한 다음 칸 */
  const nextFor = (colors: string[]) => pic.regions.findIndex((rg, k) => !paintedRef.current[k] && colors.includes(rg.color))

  const onPress = (p: Press) => {
    if (done) return
    const btn = p.target?.closest<HTMLElement>('[data-color]')
    const color = btn?.dataset.color
    if (color) {
      sfx.pop()
      setSel((s) => ({ ...s, [p.role]: color }))
      active.current = { role: p.role, color }
      setGlowColor(null)
      nag('color_rub')
      return
    }
    /* 동생: 구역 아무 데나 → 자기 색 칸 칠하기 (넉넉한 판정) */
    if (p.role === 'dong' || p.role === ctx.bot) {
      const k = nextFor(own(p.role))
      if (k >= 0) {
        active.current = { role: p.role, color: pic.regions[k].color }
        setSel((s) => ({ ...s, [p.role]: pic.regions[k].color }))
        paint(k)
      }
    }
  }
  useKeyboardPress((p) => {
    const k = nextFor(own(p.role))
    if (k >= 0) paint(k)
  })

  /** 이 칸을 지금 고른 색으로 칠해도 되는지. 안 되면 부탁·안내 음성 */
  const mayRub = (i: number) => {
    const rg = pic.regions[i]
    const owner = ownerOf(rg.color)
    const a = active.current
    if (a && a.color === rg.color) return true
    const vars = { 색: COLORS[rg.color].name, 누구: ctx.names[owner], 칸: rg.name }
    setGlowColor(rg.color)
    sfx.hmm()
    if (owner === 'dong' || owner === ctx.bot) nag('color_need', vars)
    else if (!a) nag('color_pick')
    else nag('color_mine', vars)
    return false
  }

  const toSvg = (x: number, y: number) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    const q = pt.matrixTransform(m.inverse())
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`
  }

  const onDown = (e: RPE<SVGSVGElement>) => {
    if (done || rub.current) return
    const el = (e.target as Element).closest('[data-i]')
    if (!el) return
    const i = Number(el.getAttribute('data-i'))
    if (paintedRef.current[i] || !mayRub(i)) return
    const r = el.getBoundingClientRect()
    rub.current = { i, id: e.pointerId, x: e.clientX, y: e.clientY, need: rubNeed(r.width, r.height), soundAt: 0 }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ }
    const p = toSvg(e.clientX, e.clientY)
    if (p) strokes.current[i].push(p)
    progress.current[i] = Math.max(progress.current[i], 0.04)
    redraw()
  }
  const onMove = (e: RPE<SVGSVGElement>) => {
    const r = rub.current
    if (!r || r.id !== e.pointerId) return
    const dist = Math.hypot(e.clientX - r.x, e.clientY - r.y)
    if (dist < 4) return
    r.x = e.clientX
    r.y = e.clientY
    const p = toSvg(e.clientX, e.clientY)
    const list = strokes.current[r.i]
    if (p) list[list.length - 1] += ' ' + p
    progress.current[r.i] += dist / r.need
    const now = performance.now()
    if (now - r.soundAt > 260) { r.soundAt = now; sfx.sseuk() }
    if (progress.current[r.i] >= 1) {
      const i = r.i
      rub.current = null
      paint(i)
    }
    redraw()
  }
  const onUp = (e: RPE<SVGSVGElement>) => {
    if (rub.current && rub.current.id === e.pointerId) rub.current = null
  }

  /* 혼자 모드: 든든이가 가끔 자기 색 칸을 칠함 */
  useEffect(() => {
    if (!ctx.bot || done) return
    const t = setInterval(() => {
      const k = nextFor(own(ctx.bot!))
      if (k >= 0 && alive()) {
        setSel((s) => ({ ...s, [ctx.bot!]: pic.regions[k].color }))
        paint(k)
      }
    }, 3800)
    return () => clearInterval(t)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { say('color_intro') }, [])

  const center = (
    <div className={cx('paper')}>
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        className={cx('picture')}
        aria-label={pic.name}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <defs>
          {pic.regions.map((rg, i) => <clipPath key={i} id={`cl-${uid}-${i}`}><path d={rg.d} /></clipPath>)}
        </defs>
        {pic.regions.map((rg, i) => {
          const hex = COLORS[rg.color]?.hex || '#ddd'
          return (
            <g key={i}>
              <path
                d={rg.d}
                data-i={i}
                className={cx('region' + (painted[i] ? ' painted' : '') + (pop === i ? ' pop' : '') + (!painted[i] && glowColor === rg.color ? ' want' : ''))}
                style={{ '--rc': hex } as CSSProperties}
              />
              {!painted[i] && strokes.current[i].length > 0 && (
                <g clipPath={`url(#cl-${uid}-${i})`} pointerEvents="none">
                  {strokes.current[i].map((pts, k) => (
                    <polyline key={k} points={pts} fill="none" stroke={hex} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
                  ))}
                </g>
              )}
            </g>
          )
        })}
        {pic.deco && <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: pic.deco }} />}
      </svg>
    </div>
  )

  return (
    <SplitScreen
      ctx={ctx}
      header={header}
      center={center}
      onPress={onPress}
      zone={(r) => {
        const cs = own(r)
        const left = cs.some((c) => pic.regions.some((rg, k) => !painted[k] && rg.color === c))
        return {
          wave: done || (glowColor !== null && cs.includes(glowColor)),
          glow: glowColor !== null && cs.includes(glowColor),
          dim: !done && !left,
          mood: done ? 'joy' : 'happy',
          content: (
            <div className={cx('palette n' + cs.length)}>
              {cs.map((c) => (
                <div
                  key={c}
                  data-act
                  data-color={c}
                  className={cx('swatch' + (sel[r] === c ? ' sel' : '') + (glowColor === c ? ' want' : ''))}
                  style={{ '--sw': COLORS[c].hex } as CSSProperties}
                  aria-label={COLORS[c].name}
                >
                  <span>🖌️</span>
                </div>
              ))}
            </div>
          ),
        }
      }}
    />
  )
}

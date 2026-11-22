import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPE } from 'react'
import { Dundun, Glyph } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'
import type { StepDo } from '../data/habits'
import { cx } from '../cx'

/* 단계마다 하는 손놀이 (반짝반짝 습관 놀이)
   - 문지르기(clean): 쓱쓱 문지르면 세균·물방울이 하나씩 사라짐
   - 문지르기(foam): 쓱쓱 문지르면 거품이 뽀글뽀글 생김
   - 옮기기(drag): 물건을 끌어서 알맞은 곳에 놓기 (가까이만 가져가도 됨 — 넉넉한 판정)
   틀려도 벌 없음: 놓친 물건은 제자리로 살짝 돌아가고 손가락 힌트만 */

export const FOAM_COUNT = 10
const FOAM_STEP_PX = 34

const Thing = ({ icon, className }: { icon: string; className?: string }) =>
  icon === 'dundun' ? <span className={className}><Dundun mood="happy" /></span> : <Glyph icon={icon} className={className} />

export function ActionPad({ act, onDone }: { act: StepDo; onDone: () => void }) {
  useEffect(() => {
    void say(act.type === 'drag' ? 'do_drag' : act.mode === 'foam' ? 'do_foam' : 'do_rub')
  }, [act])
  return act.type === 'drag' ? <DragPad act={act} onDone={onDone} /> : <RubPad act={act} onDone={onDone} />
}

/* ---------- 문지르기 ---------- */
type Spot = { x: number; y: number; on: boolean; r: number }
const CLEAN_SPOTS: [number, number][] = [[36, 32], [58, 28], [70, 48], [44, 52], [30, 66], [56, 70], [66, 64]]

function RubPad({ act, onDone }: { act: Extract<StepDo, { type: 'rub' }>; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [spots, setSpots] = useState<Spot[]>(() =>
    act.mode === 'clean' ? CLEAN_SPOTS.map(([x, y], i) => ({ x, y, on: true, r: (i * 47) % 30 - 15 })) : [])
  const [touched, setTouched] = useState(false)
  const [finished, setFinished] = useState(false)
  const last = useRef<{ x: number; y: number; acc: number } | null>(null)
  const soundAt = useRef(0)

  const finish = () => {
    if (finished) return
    setFinished(true)
    sfx.sparkle()
    setTimeout(onDone, 650)
  }

  const at = (e: RPE<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    return { px: e.clientX - r.left, py: e.clientY - r.top, w: r.width, h: r.height }
  }
  const down = (e: RPE<HTMLDivElement>) => {
    if (finished) return
    setTouched(true)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ }
    const { px, py } = at(e)
    last.current = { x: px, y: py, acc: 0 }
    rubAt(e)
  }
  const rubAt = (e: RPE<HTMLDivElement>) => {
    const { px, py, w, h } = at(e)
    const now = performance.now()
    if (now - soundAt.current > 240) { soundAt.current = now; sfx.sseuk() }
    if (act.mode === 'clean') {
      const rad = Math.min(w, h) * 0.17
      setSpots((list) => {
        let changed = false
        const next = list.map((s) => {
          if (!s.on) return s
          const dx = (s.x / 100) * w - px
          const dy = (s.y / 100) * h - py
          if (dx * dx + dy * dy < rad * rad) { changed = true; return { ...s, on: false } }
          return s
        })
        if (!changed) return list
        sfx.pop()
        if (next.every((s) => !s.on)) setTimeout(finish, 0)
        return next
      })
    } else {
      const l = last.current
      if (!l) return
      l.acc += Math.hypot(px - l.x, py - l.y)
      l.x = px
      l.y = py
      if (l.acc >= FOAM_STEP_PX) {
        l.acc = 0
        setSpots((list) => {
          if (list.length >= FOAM_COUNT) return list
          const next = [...list, { x: (px / w) * 100, y: (py / h) * 100, on: true, r: (list.length * 53) % 40 - 20 }]
          if (next.length >= FOAM_COUNT) setTimeout(finish, 0)
          return next
        })
      }
    }
  }
  const move = (e: RPE<HTMLDivElement>) => { if (last.current) rubAt(e) }
  const up = () => { last.current = null }

  const left = act.mode === 'clean' ? spots.filter((s) => s.on).length : FOAM_COUNT - spots.length
  return (
    <div ref={ref} className={cx('pad rub' + (finished ? ' fin' : ''))} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <Thing icon={act.target} className={cx('pad-target')} />
      {spots.map((s, i) => (
        <span key={i} className={cx('spot' + (s.on ? '' : ' gone') + (act.mode === 'foam' ? ' foam' : ''))} style={{ left: s.x + '%', top: s.y + '%', '--r': s.r + 'deg' } as CSSProperties}>
          <Glyph icon={act.spot} />
        </span>
      ))}
      {!touched && <span className={cx('hand rub-hand')} aria-hidden="true">👆</span>}
      <div className={cx('pad-meter')} aria-label={`남은 ${left}`}>
        {Array.from({ length: act.mode === 'clean' ? CLEAN_SPOTS.length : FOAM_COUNT }, (_, i) => <i key={i} className={i < (act.mode === 'clean' ? CLEAN_SPOTS.length - left : spots.length) ? cx('on') : ''} />)}
      </div>
      {finished && <span className={cx('pad-sparkle')}>✨</span>}
    </div>
  )
}

/* ---------- 옮기기 ---------- */
function DragPad({ act, onDone }: { act: Extract<StepDo, { type: 'drag' }>; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const st = useRef<{ id: number; x: number; y: number } | null>(null)
  const [off, setOff] = useState<{ x: number; y: number } | null>(null)
  const [done, setDone] = useState(false)
  const [touched, setTouched] = useState(false)
  const [back, setBack] = useState(0)
  const home = useMemo(() => ({ left: '20%', top: '62%' }), [])

  const down = (e: RPE<HTMLDivElement>) => {
    if (done || st.current) return
    setTouched(true)
    st.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ }
    sfx.pop()
    setOff({ x: 0, y: 0 })
  }
  const move = (e: RPE<HTMLDivElement>) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    setOff({ x: e.clientX - s.x, y: e.clientY - s.y })
  }
  const up = (e: RPE<HTMLDivElement>) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    st.current = null
    const t = targetRef.current?.getBoundingClientRect()
    const pad = ref.current?.getBoundingClientRect()
    const near = t && pad && Math.hypot(e.clientX - (t.left + t.width / 2), e.clientY - (t.top + t.height / 2)) < Math.max(t.width, t.height) * 0.75 + pad.width * 0.05
    if (near) {
      setDone(true)
      sfx.ding()
      setTimeout(onDone, 700)
    } else {
      sfx.hmm()
      setOff(null)
      setBack((b) => b + 1)
    }
  }

  return (
    <div ref={ref} className={cx('pad drag' + (done ? ' fin' : ''))}>
      <div ref={targetRef} className={cx('drop' + (done ? ' got' : ''))}>
        <Thing icon={act.target} className={cx('pad-target')} />
        {done && <span className={cx('pad-sparkle')}>✨</span>}
      </div>
      {!done && (
        <svg className={cx('drag-path')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M24 64 Q46 30 70 46" fill="none" stroke="rgba(59,54,81,.35)" strokeWidth="1.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div
        key={back}
        className={cx('item' + (off ? ' dragging' : '') + (done ? ' placed' : '') + (back ? ' back' : ''))}
        style={(done ? {} : { ...home, transform: off ? `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px)) scale(1.08)` : undefined }) as CSSProperties}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { st.current = null; setOff(null) }}
      >
        <Glyph icon={act.item} />
      </div>
      {!touched && <span className={cx('hand drag-hand')} aria-hidden="true">👆</span>}
    </div>
  )
}

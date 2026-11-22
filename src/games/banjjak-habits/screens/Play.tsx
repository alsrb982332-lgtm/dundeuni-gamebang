import { cx } from '../cx'
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react'
import { stepsFor, type Habit, type Step, type StepDo } from '../data/habits'
import { ActionPad } from '../components/ActionPad'
import { DundunStage, StepIcon } from '../components/Habit'
import { Tap } from '../../../shared/Tap'
import { say, line } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { playSfx, sfx } from '../../../shared/sfx'
import { shuffle, sleep } from '../../../shared/storage'

export type Mode = 'dong' | 'hyeong'
const NUM = ['①', '②', '③', '④', '⑤']

type Props = { habit: Habit; mode: Mode; five: boolean; drag: boolean; onDone: () => void; onHome: () => void }

/* 단계 손놀이(문지르기·옮기기)를 기다리는 도우미 */
function useAction() {
  const [doing, setDoing] = useState<StepDo | null>(null)
  const resolve = useRef<(() => void) | null>(null)
  const run = (d?: StepDo) => (d ? new Promise<void>((res) => { resolve.current = res; setDoing(d) }) : Promise.resolve())
  const overlay = doing ? <ActionPad key={JSON.stringify(doing)} act={doing} onDone={() => { setDoing(null); resolve.current?.() }} /> : null
  return { run, overlay }
}

export function Play(props: Props) {
  return props.mode === 'dong' ? <DongPlay {...props} /> : <HyeongPlay {...props} />
}

function TopBar({ habit, onHome, onSay }: { habit: Habit; onHome: () => void; onSay: () => void }) {
  return (
    <header className={cx('top')}>
      <div className={cx('left')}>
        <Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap>
        <div className={cx('ztitle')}><StepIcon icon={habit.icon} /> {habit.name}</div>
      </div>
      <div className={cx('right')}>
        <Tap className={cx('icon')} aria-label="다시 듣기" onTap={onSay}>🔈</Tap>
      </div>
    </header>
  )
}

/* ---------- 동생 모드: 보고 듣고 따라 누르기 ---------- */
function DongPlay({ habit, onDone, onHome }: Props) {
  const alive = useAlive()
  const action = useAction()
  const steps = useMemo(() => stepsFor(habit, 'dong', false), [habit])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(0)
  const [cur, setCur] = useState<Step | null>(null)
  const [bubble, setBubble] = useState('')
  const [nudge, setNudge] = useState(false)
  const busy = useRef(true)
  const nagAt = useRef(0)

  const prompt = (i: number) => {
    const s = steps[i]
    busy.current = false
    return say(`step_${habit.id}_${s.id}`, { text: s.say + ' ' + line('tap_prompt') })
  }

  useEffect(() => {
    (async () => {
      await say(`habit_${habit.id}`, { text: habit.name + '!' })
      if (alive()) prompt(0)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onTap(i: number) {
    if (i !== idx) {
      setNudge(true)
      setTimeout(() => alive() && setNudge(false), 600)
      const now = performance.now()
      if (now - nagAt.current > 2000) { nagAt.current = now; say('dong_other') }
      return
    }
    if (busy.current) return
    busy.current = true
    const s = steps[i]
    await action.run(s.do)
    if (!alive()) return
    playSfx(s.sfx)
    setCur(s)
    setPlaying((p) => p + 1)
    if (s.repeat) {
      setBubble(s.repeat)
      await say(`repeat_${habit.id}_${s.id}`, { text: line('repeat', { 말: s.repeat }) })
    } else await sleep(1600)
    if (!alive()) return
    setBubble('')
    const n = i + 1
    setIdx(n)
    if (n >= steps.length) {
      await sleep(400)
      if (alive()) onDone()
      return
    }
    await sleep(300)
    if (alive()) prompt(n)
  }

  return (
    <>
      <TopBar habit={habit} onHome={onHome} onSay={() => idx < steps.length && prompt(idx)} />
      <main className={cx('screen play dong')}>
        <DundunStage step={cur} playing={playing} bubble={bubble} scene={habit.scene} overlay={action.overlay} />
        <div className={cx('dong-row')}>
          {steps.map((s, i) => (
            <div key={s.id} className={cx('dong-cell')}>
              {i > 0 && <span className={cx('arrow')}>▶</span>}
              {i < idx ? (
                <div className={cx('scard done')}><StepIcon icon={s.icon} /><span className={cx('lb')}>{s.label}</span><span className={cx('check')}>✔</span></div>
              ) : i === idx ? (
                <Tap className={cx('scard now' + (nudge ? ' nudge' : ''))} aria-label={s.label} onTap={() => onTap(i)}>
                  <StepIcon icon={s.icon} /><span className={cx('lb')}>{s.label}</span>
                </Tap>
              ) : (
                <Tap className={cx('scard later')} aria-label="다음 단계" onTap={() => onTap(i)}><span className={cx('q')}>?</span></Tap>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

/* ---------- 형 모드: 섞인 카드 순서 맞히기 ---------- */
function HyeongPlay({ habit, five, drag, onDone, onHome }: Props) {
  const alive = useAlive()
  const action = useAction()
  const steps = useMemo(() => stepsFor(habit, 'hyeong', five), [habit, five])
  const tray0 = useMemo(() => {
    let t = shuffle(steps)
    for (let k = 0; k < 5 && t.every((s, i) => s.id === steps[i].id); k++) t = shuffle(steps) // 처음부터 정답 순서면 다시 섞기
    return t
  }, [steps])
  const [placed, setPlaced] = useState<Step[]>([])
  const placedRef = useRef<Step[]>([])
  const [wobble, setWobble] = useState('')
  const [hint, setHint] = useState('')
  const [playing, setPlaying] = useState(0)
  const [cur, setCur] = useState<Step | null>(null)
  const [bubble, setBubble] = useState('')
  const [showSlot, setShowSlot] = useState(-1)
  const [phase, setPhase] = useState<'order' | 'playback'>('order')
  const wrong = useRef(0)
  const busy = useRef(true)
  const slotsRef = useRef<HTMLDivElement>(null)

  const askNext = (n: number) => {
    busy.current = false
    if (n === 0) return say('first_ask', { vars: { 때: habit.when } })
    return say(n === steps.length - 1 ? 'last_ask' : 'next_ask')
  }

  useEffect(() => {
    (async () => {
      await say(`habit_${habit.id}`, { text: habit.name + '!' })
      if (alive()) askNext(0)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function pickCard(s: Step) {
    if (phase !== 'order' || busy.current) return
    const n = placedRef.current.length
    const expected = steps[n]
    if (s.id === expected.id) {
      busy.current = true
      wrong.current = 0
      setHint('')
      sfx.ding()
      setTimeout(() => playSfx(s.sfx), 200)
      placedRef.current = [...placedRef.current, s]
      setPlaced(placedRef.current)
      await action.run(s.do)
      if (!alive()) return
      setCur(s)
      setPlaying((p) => p + 1)
      if (s.repeat) {
        setBubble(s.repeat)
        await say(`repeat_${habit.id}_${s.id}`, { text: line('repeat', { 말: s.repeat }) })
        if (alive()) setBubble('')
      } else await say(`label_${habit.id}_${s.id}`, { text: s.label })
      if (!alive()) return
      if (n + 1 >= steps.length) return playback()
      await sleep(250)
      if (alive()) askNext(n + 1)
    } else {
      /* 틀리면: 카드가 제자리로 살짝 돌아가고 힌트만 (부정적 표시 없음) */
      sfx.hmm()
      wrong.current++
      setWobble(s.id)
      setTimeout(() => alive() && setWobble(''), 600)
      const showHint = wrong.current >= 2
      if (showHint) setHint(expected.id)
      await say('wrong_hint')
      if (showHint && alive()) await say('glow_hint')
    }
  }

  async function playback() {
    setPhase('playback')
    await sleep(400)
    await say('playback')
    for (let i = 0; i < steps.length; i++) {
      if (!alive()) return
      const s = steps[i]
      setShowSlot(i)
      setCur(s)
      setPlaying((p) => p + 1)
      playSfx(s.sfx)
      if (s.repeat) setBubble(s.repeat)
      await say(`label_${habit.id}_${s.id}`, { text: s.repeat || s.label })
      await sleep(700)
      setBubble('')
    }
    if (alive()) onDone()
  }

  const tray = tray0.filter((s) => !placed.some((p) => p.id === s.id))

  return (
    <>
      <TopBar habit={habit} onHome={onHome} onSay={() => phase === 'order' && askNext(placed.length)} />
      <main className={cx('screen play hyeong')}>
        <DundunStage step={cur} playing={playing} bubble={bubble} scene={habit.scene} overlay={action.overlay} />
        <div className={cx('slots')} ref={slotsRef}>
          {steps.map((_, i) => {
            const p = placed[i]
            return (
              <div key={i} className={cx('slot' + (p ? ' full' : '') + (i === placed.length && phase === 'order' ? ' next' : '') + (showSlot === i ? ' show' : ''))}>
                <span className={cx('num')}>{NUM[i]}</span>
                {p && <><StepIcon icon={p.icon} /><span className={cx('lb')}>{p.label}</span></>}
              </div>
            )
          })}
        </div>
        <div className={cx('tray')}>
          {tray.map((s) => (
            <DragCard key={s.id} step={s} drag={drag} wobble={wobble === s.id} hint={hint === s.id} dropRef={slotsRef} onPick={() => pickCard(s)} />
          ))}
        </div>
      </main>
    </>
  )
}

/* 누르면 다음 칸으로 쏙 (설정에서 켜면 끌어다 놓기도 가능) */
function DragCard({ step, drag, wobble, hint, dropRef, onPick }: { step: Step; drag: boolean; wobble: boolean; hint: boolean; dropRef: React.RefObject<HTMLDivElement | null>; onPick: () => void }) {
  const st = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const [off, setOff] = useState<{ x: number; y: number } | null>(null)
  const down = (e: RPE<HTMLButtonElement>) => {
    if (st.current) return
    st.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ }
    e.currentTarget.classList.add('pressing')
  }
  const move = (e: RPE<HTMLButtonElement>) => {
    const s = st.current
    if (!s || s.id !== e.pointerId || !drag) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.moved && Math.hypot(dx, dy) > 12) s.moved = true
    if (s.moved) setOff({ x: dx, y: dy })
  }
  const up = (e: RPE<HTMLButtonElement>) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    st.current = null
    e.currentTarget.classList.remove('pressing')
    setOff(null)
    if (s.moved) {
      const r = dropRef.current?.getBoundingClientRect()
      if (r && e.clientX >= r.left - 30 && e.clientX <= r.right + 30 && e.clientY >= r.top - 30 && e.clientY <= r.bottom + 30) onPick()
      return
    }
    const b = e.currentTarget.getBoundingClientRect()
    if (e.clientX >= b.left - 40 && e.clientX <= b.right + 40 && e.clientY >= b.top - 40 && e.clientY <= b.bottom + 40) onPick()
  }
  return (
    <button
      type="button"
      className={cx('scard' + (wobble ? ' wobble' : '') + (hint ? ' hint' : '') + (off ? ' dragging' : ''))}
      style={off ? { transform: `translate(${off.x}px, ${off.y}px) scale(1.06)` } : undefined}
      aria-label={step.label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { st.current = null; setOff(null) }}
      onClick={(e) => { if (e.detail === 0) onPick() }}
    >
      <StepIcon icon={step.icon} />
      <span className={cx('lb')}>{step.label}</span>
    </button>
  )
}

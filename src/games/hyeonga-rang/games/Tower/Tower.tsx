import { cx } from '../../cx'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SplitScreen, type PlayCtx } from '../../components/SplitScreen'
import { StarSticker } from '../../../../shared/art/Art'
import { useKeyboardPress, type Press } from '../../useMultiTouch'
import { useTurn } from '../../useTurn'
import type { Role } from '../../progress'
import { say } from '../../../../shared/useVoice'
import { useAlive } from '../../../../shared/useAlive'
import { sfx } from '../../../../shared/sfx'
import { sleep } from '../../../../shared/storage'

/* 차례차례 탑 쌓기 — 번갈아 8층. 차례가 아닐 때 누르면 "조금만 기다려 줘~" (벌 없음) */
const FLOORS = 8

export function Tower({ ctx, onWin, header }: { ctx: PlayCtx; onWin: () => void; header: ReactNode }) {
  const alive = useAlive()
  const { turn, setTurn } = useTurn('hyeong')
  const turnRef = useRef<Role>('hyeong')
  const [blocks, setBlocks] = useState<{ r: Role; dx: number; rot: number }[]>([])
  const [shake, setShake] = useState<Role | null>(null)
  const [done, setDone] = useState(false)
  const count = useRef(0)
  const busy = useRef(true)
  const nagAt = useRef(0)

  async function announce(r: Role) {
    busy.current = false
    await say(r === 'hyeong' ? 'turn_hyeong' : 'turn_dong')
  }

  async function place(r: Role) {
    busy.current = true
    sfx.thunk()
    count.current++
    setBlocks((b) => [...b, { r, dx: Math.round(Math.random() * 16 - 8), rot: Math.round(Math.random() * 6 - 3) }])
    if (count.current >= FLOORS) {
      setDone(true)
      await sleep(600)
      sfx.sparkle()
      await say('tower_done')
      if (alive()) onWin()
      return
    }
    const n: Role = r === 'hyeong' ? 'dong' : 'hyeong'
    turnRef.current = n
    setTurn(n)
    await sleep(300)
    if (alive()) announce(n)
  }

  const onPress = (p: Press) => {
    if (done) return
    if (p.role !== turnRef.current) {
      /* 차례가 아닌 쪽: 부드럽게 기다려 달라고만 함 */
      const now = performance.now()
      setShake(p.role)
      setTimeout(() => alive() && setShake(null), 500)
      if (now - nagAt.current > 2200) {
        nagAt.current = now
        say('wait_turn')
      }
      return
    }
    if (busy.current) return
    if (p.role === 'hyeong' && !p.onButton) return
    place(p.role)
  }
  useKeyboardPress(onPress)

  /* 혼자 모드: 든든이 차례면 잠시 뒤에 쌓음 */
  useEffect(() => {
    if (!ctx.bot || done || turn !== ctx.bot) return
    const t = setTimeout(() => { if (alive() && turnRef.current === ctx.bot) place(ctx.bot!) }, 1700)
    return () => clearTimeout(t)
  }, [turn, done]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      await say('tower_intro')
      if (alive()) announce('hyeong')
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const center = (
    <div className={cx('tower-wrap')}>
      <div className={cx('tower')}>
        {done && <StarSticker className={cx('top-star')} />}
        {[...blocks].reverse().map((b, i) => (
          <div
            key={blocks.length - i}
            className={cx('block')}
            style={{ '--bc': ctx.colors[b.r].b, '--bd': ctx.colors[b.r].d, transform: `translateX(${b.dx}px) rotate(${b.rot}deg)` } as CSSProperties}
          >
            <span>{b.r === 'hyeong' ? '●' : '▲'}</span>
          </div>
        ))}
        {Array.from({ length: FLOORS - blocks.length }, (_, i) => <div key={'g' + i} className={cx('block ghost')} />)}
      </div>
      <div className={cx('tower-base')} />
    </div>
  )

  return (
    <SplitScreen
      ctx={ctx}
      header={header}
      center={center}
      onPress={onPress}
      zone={(r) => {
        const mine = !done && turn === r
        return {
          glow: mine,
          dim: !done && !mine,
          wave: mine || done,
          shake: shake === r,
          mood: done ? 'joy' : 'happy',
          content: mine ? (
            <div data-act className={cx('zbtn block-btn ready')} style={{ '--bc': ctx.colors[r].b, '--bd': ctx.colors[r].d } as CSSProperties}>
              <span className={cx('zi')}>{r === 'hyeong' ? '●' : '▲'}</span>
              <span className={cx('zl')}>쌓기!</span>
            </div>
          ) : (
            <div className={cx('zwait')}>{done ? '🎉' : '⏳'}</div>
          ),
        }
      }}
    />
  )
}

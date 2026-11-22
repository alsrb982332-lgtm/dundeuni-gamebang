import { cx } from '../../cx'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { SplitScreen, type PlayCtx } from '../../components/SplitScreen'
import { Dundun } from '../../../../shared/art/Art'
import { makeSync, useKeyboardPress, type Press } from '../../useMultiTouch'
import type { Role } from '../../progress'
import { say } from '../../../../shared/useVoice'
import { useAlive } from '../../../../shared/useAlive'
import { sfx } from '../../../../shared/sfx'
import { sleep } from '../../../../shared/storage'

/* 번갈아 꾹! — 형 한 번, 동생 한 번 누르면 다리 한 칸. 5칸이면 성공 (동시에 누르지 않아도 됨) */
const PLANKS = 5

export function Bridge({ ctx, onWin, header }: { ctx: PlayCtx; onWin: () => void; header: ReactNode }) {
  const alive = useAlive()
  const [planks, setPlanks] = useState(0)
  const [arm, setArm] = useState<Record<Role, boolean>>({ hyeong: false, dong: false })
  const [count, setCount] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const seq = useRef(0)
  const busy = useRef(false)
  const doneRef = useRef(false)
  const nagAt = useRef(0)

  /* 안내: 처음에는 설명, 그다음부터는 「이제 ○○ 차례!」 (형부터, 번갈아) */
  async function countdown(withIntro: boolean) {
    const my = ++seq.current
    if (withIntro) await say('bridge_intro')
    if (!alive() || seq.current !== my || ctx.bot === 'hyeong') return
    setCount(null)
    await say('wait_hyeong')
  }

  const sync = useMemo(
    () =>
      makeSync({
        windowMs: () => ctx.syncMs,
        onArm: (r, on) => setArm((a) => ({ ...a, [r]: on })),
        onBoth: () => place(),
        onLonely: (who) => {
          if (doneRef.current || busy.current || ctx.bot) return
          const now = performance.now()
          if (now - nagAt.current < 2500) return
          nagAt.current = now
          seq.current++
          setCount(null)
          say(who === 'hyeong' ? 'wait_dong' : 'wait_hyeong')
        },
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  async function place() {
    if (doneRef.current || busy.current) return
    busy.current = true
    seq.current++
    setCount(null)
    sfx.thunk()
    setTimeout(() => sfx.ding(), 120)
    const n = planksRef.current + 1
    planksRef.current = n
    setPlanks(n)
    if (n >= PLANKS) {
      doneRef.current = true
      setDone(true)
      await sleep(900)
      await say('bridge_done')
      if (alive()) onWin()
      return
    }
    await say(n % 2 ? 'bridge_ok' : 'bridge_ok2')
    busy.current = false
    if (alive()) countdown(false)
  }
  const planksRef = useRef(0)

  const onPress = (p: Press) => {
    if (doneRef.current || busy.current) return
    if (p.role === 'hyeong' && !p.onButton) return // 형은 버튼을 눌러야 함, 동생은 구역 아무 데나
    sfx.pop()
    sync.press(p.role, p.at)
    /* 혼자 모드: 든든이가 조금 뒤에 따라 누름 */
    if (ctx.bot && p.role !== ctx.bot) {
      const bot = ctx.bot
      setTimeout(() => { if (alive() && !busy.current && !doneRef.current) sync.press(bot) }, 350 + Math.random() * 400)
    }
  }
  useKeyboardPress(onPress)

  useEffect(() => {
    countdown(true)
    return () => sync.clear()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const leftRole: Role = ctx.settings.hyeongSide === 'left' ? 'hyeong' : 'dong'
  const rightRole: Role = leftRole === 'hyeong' ? 'dong' : 'hyeong'

  const center = (
    <div className={cx('river-wrap')}>
      <div className={cx('count' + (count ? ' on' : ''))} key={count ?? 0}>{count ?? ''}</div>
      <div className={cx('river')}>
        <div className={cx('bank left')} />
        <div className={cx('water')}><span>〰️</span><span>〰️</span><span>〰️</span></div>
        <div className={cx('bank right')}><span className={cx('flag')}>🚩</span></div>
        <div className={cx('planks')}>
          {Array.from({ length: PLANKS }, (_, i) => (
            <div key={i} className={cx('plank' + (i < planks ? ' set' : i === planks ? ' next' : ''))}>
              {i === planks && !done && (
                <>
                  <i className={cx('half ' + (arm[leftRole] ? 'on' : ''))} style={{ '--hc': ctx.colors[leftRole].b } as CSSProperties} />
                  <i className={cx('half ' + (arm[rightRole] ? 'on' : ''))} style={{ '--hc': ctx.colors[rightRole].b } as CSSProperties} />
                </>
              )}
            </div>
          ))}
        </div>
        <div className={cx('walker' + (done ? ' done' : ''))} style={{ '--pos': done ? PLANKS + 1 : planks } as CSSProperties}>
          <Dundun mood={done ? 'joy' : 'happy'} />
        </div>
      </div>
    </div>
  )

  return (
    <SplitScreen
      ctx={ctx}
      header={header}
      center={center}
      onPress={onPress}
      zone={(r) => ({
        glow: arm[r],
        wave: arm[r],
        mood: done ? 'joy' : 'happy',
        content: (
          <div data-act className={cx('zbtn round' + (arm[r] ? ' on' : '') + (count === null && !done ? ' ready' : ''))}>
            <span className={cx('zi')}>🖐️</span>
            <span className={cx('zl')}>꾹!</span>
          </div>
        ),
      })}
    />
  )
}

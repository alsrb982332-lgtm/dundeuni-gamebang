import { cx } from '../../cx'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SplitScreen, type PlayCtx } from '../../components/SplitScreen'
import { makeSync, useKeyboardPress, type Press } from '../../useMultiTouch'
import type { Role } from '../../progress'
import { say } from '../../../../shared/useVoice'
import { useAlive } from '../../../../shared/useAlive'
import { sfx } from '../../../../shared/sfx'
import { shuffle, sleep } from '../../../../shared/storage'

/* 짐 나르기 — 큰 상자는 둘이 동시에, 작은 상자는 정해진 한 명이. 5개 옮기면 성공 */
type Box = { big: boolean; owner?: Role }

function makeBoxes(): Box[] {
  const kinds = shuffle([true, true, false, false, Math.random() < 0.5])
  let who: Role = Math.random() < 0.5 ? 'hyeong' : 'dong'
  return kinds.map((big) => {
    if (big) return { big }
    const b = { big, owner: who }
    who = who === 'hyeong' ? 'dong' : 'hyeong' // 작은 상자는 번갈아 가며
    return b
  })
}

export function Moving({ ctx, onWin, header }: { ctx: PlayCtx; onWin: () => void; header: ReactNode }) {
  const alive = useAlive()
  const boxes = useMemo(makeBoxes, [])
  const [idx, setIdx] = useState(0)
  const idxRef = useRef(0)
  const [arm, setArm] = useState<Record<Role, boolean>>({ hyeong: false, dong: false })
  const [moving, setMoving] = useState(false)
  const [wiggle, setWiggle] = useState(false)
  const [shake, setShake] = useState<Role | null>(null)
  const busy = useRef(true)
  const nagAt = useRef(0)
  const done = idx >= boxes.length

  const nag = (key: string) => {
    const now = performance.now()
    if (now - nagAt.current < 2400) return
    nagAt.current = now
    say(key)
  }

  async function announce(i: number) {
    const b = boxes[i]
    busy.current = false
    await say(b.big ? 'box_big' : b.owner === 'hyeong' ? 'box_small_hyeong' : 'box_small_dong')
  }

  async function carry() {
    if (busy.current) return
    busy.current = true
    sync.clear()
    setMoving(true)
    sfx.whoosh()
    await sleep(900)
    sfx.thunk()
    const n = idxRef.current + 1
    idxRef.current = n
    setIdx(n)
    setMoving(false)
    if (n >= boxes.length) {
      await sleep(400)
      sfx.sparkle()
      await say('move_done')
      if (alive()) onWin()
      return
    }
    await say('box_ok')
    if (alive()) announce(n)
  }

  const sync = useMemo(
    () =>
      makeSync({
        windowMs: () => ctx.syncMs,
        onArm: (r, on) => setArm((a) => ({ ...a, [r]: on })),
        onBoth: () => carry(),
        onLonely: (who) => { if (!ctx.bot) nag(who === 'hyeong' ? 'wait_dong' : 'wait_hyeong') },
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const onPress = (p: Press) => {
    const i = idxRef.current
    if (i >= boxes.length || busy.current) return
    const b = boxes[i]
    if (p.role === 'hyeong' && !p.onButton) return
    if (b.big) {
      sfx.pop()
      setWiggle(true)
      setTimeout(() => alive() && setWiggle(false), 400)
      sync.press(p.role, p.at)
      if (ctx.bot && p.role !== ctx.bot) {
        const bot = ctx.bot
        setTimeout(() => { if (alive() && !busy.current) sync.press(bot) }, 400 + Math.random() * 400)
      }
      return
    }
    if (p.role !== b.owner) {
      setShake(p.role)
      setTimeout(() => alive() && setShake(null), 500)
      nag('wait_turn')
      return
    }
    carry()
  }
  useKeyboardPress(onPress)

  /* 혼자 모드: 든든이 몫의 작은 상자는 든든이가 옮김 */
  useEffect(() => {
    const b = boxes[idx]
    if (!ctx.bot || !b || b.big || b.owner !== ctx.bot) return
    const t = setTimeout(() => { if (alive() && idxRef.current === idx) { busy.current = false; carry() } }, 2600)
    return () => clearTimeout(t)
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      await say('move_intro')
      if (alive()) announce(0)
    })()
    return () => sync.clear()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cur = boxes[idx]
  const center = (
    <div className={cx('moving')}>
      <div className={cx('house')}>🏠</div>
      <div className={cx('lane')}>
        {cur && (
          <div key={idx} className={cx('box ' + (cur.big ? 'big' : 'small') + (moving ? ' go' : '') + (wiggle ? ' wig' : ''))}>
            <span className={cx('tape')} />
            <span className={cx('hands')}>{cur.big ? '✋ ✋' : '✋'}</span>
          </div>
        )}
      </div>
      <div className={cx('truck')}>
        <div className={cx('load')}>
          {boxes.slice(0, idx).map((b, i) => <i key={i} className={cx(b.big ? 'big' : '')} />)}
        </div>
        <span className={cx('tr')}>🚚</span>
      </div>
      <div className={cx('box-count')}>{boxes.map((_, i) => <i key={i} className={cx(i < idx ? 'on' : '')} />)}</div>
    </div>
  )

  return (
    <SplitScreen
      ctx={ctx}
      header={header}
      center={center}
      onPress={onPress}
      zone={(r) => {
        const mine = !!cur && (cur.big || cur.owner === r)
        return {
          glow: arm[r] || (!!cur && !cur.big && cur.owner === r),
          dim: !done && !mine,
          wave: arm[r] || done,
          shake: shake === r,
          mood: done ? 'joy' : 'happy',
          content: mine ? (
            <div data-act className={cx('zbtn round lift' + (arm[r] ? ' on' : '') + ' ready')}>
              <span className={cx('zi')}>✋</span>
              <span className={cx('zl')}>영차!</span>
            </div>
          ) : (
            <div className={cx('zwait')}>{done ? '🎉' : '⏳'}</div>
          ),
        }
      }}
    />
  )
}

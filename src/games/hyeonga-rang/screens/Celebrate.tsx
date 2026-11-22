import { cx } from '../cx'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { SplitScreen, Avatar, type PlayCtx } from '../components/SplitScreen'
import { Dundun, StarSticker } from '../../../shared/art/Art'
import { makeSync, useKeyboardPress, type Press } from '../useMultiTouch'
import type { Role } from '../progress'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import { confetti } from '../../../shared/fx'
import { pick, sleep } from '../../../shared/storage'

type Phase = 'yay' | 'hf' | 'clap'

/* 같이 해냈다! → 하이파이브 (둘이 동시에 눌러야 우리 별) */
export function Celebrate({ ctx, onStar, onNext }: { ctx: PlayCtx; onStar: () => void; onNext: () => void }) {
  const alive = useAlive()
  const [phase, setPhase] = useState<Phase>('yay')
  const phaseRef = useRef<Phase>('yay')
  const [arm, setArm] = useState<Record<Role, boolean>>({ hyeong: false, dong: false })
  const nagAt = useRef(0)

  const sync = useMemo(
    () =>
      makeSync({
        windowMs: () => ctx.syncMs,
        onArm: (r, on) => setArm((a) => ({ ...a, [r]: on })),
        onBoth: () => clap(),
        onLonely: (who) => {
          if (ctx.bot) return
          const now = performance.now()
          if (now - nagAt.current < 2500) return
          nagAt.current = now
          say(who === 'hyeong' ? 'wait_dong' : 'wait_hyeong')
        },
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  async function clap() {
    if (phaseRef.current !== 'hf') return
    phaseRef.current = 'clap'
    setPhase('clap')
    sfx.clap()
    setTimeout(() => sfx.fanfare(), 250)
    confetti(['⭐', '💛', '🖐️', '✨'])
    onStar()
    await say('hf_ok')
    await sleep(600)
    if (alive()) onNext()
  }

  useEffect(() => {
    (async () => {
      sfx.fanfare()
      confetti()
      await say(ctx.bot ? 'together_solo' : 'together')
      if (!alive()) return
      if (!ctx.bot) {
        await say(pick(['thanks_hyeong', 'thanks_dong']))
        if (!alive()) return
      }
      await sleep(300)
      phaseRef.current = 'hf'
      setPhase('hf')
      await say('hf_ask')
    })()
    return () => sync.clear()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPress = (p: Press) => {
    if (phaseRef.current !== 'hf') return
    if (p.role === 'hyeong' && !p.onButton) return
    sfx.pop()
    sync.press(p.role, p.at)
    if (ctx.bot && p.role !== ctx.bot) {
      const bot = ctx.bot
      setTimeout(() => alive() && sync.press(bot), 300 + Math.random() * 300)
    }
  }
  useKeyboardPress(onPress)

  const center = (
    <div className={cx('yay')}>
      <h2 className={cx('yay-title')}>{phase === 'clap' ? '짝!' : '같이 해냈다!'}</h2>
      <div className={cx('yay-pics')}>
        <Avatar role="hyeong" ctx={ctx} wave mood="joy" />
        <Dundun mood="joy" wave className={cx('yay-dun')} />
        <Avatar role="dong" ctx={ctx} wave mood="joy" />
      </div>
      {phase === 'clap' && <StarSticker className={cx('yay-star')} />}
      {phase === 'hf' && <p className={cx('sub')}>🖐️ 손바닥을 같이 꾹!</p>}
    </div>
  )

  return (
    <SplitScreen
      ctx={ctx}
      center={center}
      onPress={onPress}
      zone={(r) => ({
        glow: arm[r],
        wave: true,
        mood: 'joy',
        content:
          phase === 'yay' ? (
            <div className={cx('zwait')}>🎉</div>
          ) : (
            <div
              data-act
              className={cx('zbtn palm' + (arm[r] ? ' on' : '') + (phase === 'hf' ? ' ready' : '') + (r === 'dong' ? ' flip' : ''))}
              style={{ '--hc': ctx.colors[r].b } as CSSProperties}
            >
              <span className={cx('zi')}>🖐️</span>
            </div>
          ),
      })}
    />
  )
}

import { cx } from '../cx'
import { useMemo, type CSSProperties } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun, Friend, StarSticker, PALETTE } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'
import type { Settings } from '../progress'

const TITLE = '형아랑 같이'
const DECO = ['🌉', '🧱', '🎨', '📦', '🖐️', '💛', '⭐', '🌈']

export function Start({ s, total, onStart, onBoard, onSettings }: { s: Settings; total: number; onStart: () => void; onBoard: () => void; onSettings: () => void }) {
  const deco = useMemo(
    () => Array.from({ length: 14 }, (_, k) => ({ e: DECO[k % DECO.length], l: Math.random() * 92, t: Math.random() * 90, fs: 26 + Math.random() * 26, d: 3 + Math.random() * 3, dl: Math.random() * 5, r: Math.random() * 40 - 20 })),
    [],
  )
  let i = 0
  return (
    <div className={cx('start')}>
      <div className={cx('deco')} aria-hidden="true">
        {deco.map((d, k) => (
          <span key={k} style={{ left: d.l + '%', top: d.t + '%', '--fs': d.fs + 'px', '--dur': d.d + 's', '--dl': -d.dl + 's', '--rot': d.r + 'deg' } as CSSProperties}>{d.e}</span>
        ))}
      </div>
      <Tap className={cx('icon small start-set')} aria-label="어른 설정" onTap={onSettings}>⚙️</Tap>
      <div className={cx('maker')}>💛 든든이 교육 게임</div>
      <h1 className={cx('title')} aria-label={TITLE}>
        {[...TITLE].map((ch, k) => (ch === ' ' ? <span key={k} className={cx('sp')} /> : <span key={k} style={{ '--i': i++ } as CSSProperties}>{ch}</span>))}
      </h1>
      <Tap className={cx('hero trio')} aria-label="든든이와 친구들" onTap={() => { sfx.boing(); say('hello') }}>
        <Friend kind={s.hyeongKind} color={PALETTE[s.hyeongColor]} mood="happy" wave />
        <Dundun mood="joy" />
        <Friend kind={s.dongKind} color={PALETTE[s.dongColor]} mood="happy" />
      </Tap>
      <Tap className={cx('big-btn bounce')} onTap={onStart}>▶ 시작</Tap>
      <Tap className={cx('big-btn soft')} aria-label="우리 별 스티커판" onTap={onBoard}>
        <StarSticker style={{ width: 48, height: 48 }} /> 우리 별 {total}
      </Tap>
    </div>
  )
}

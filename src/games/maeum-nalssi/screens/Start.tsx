import { cx } from '../cx'
import { useMemo, type CSSProperties } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun, StarSticker } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'

const TITLE = '마음 날씨'
const DECO = ['☀️', '🌧️', '🌈', '☁️', '⛈️', '💛', '🌤️', '🌫️']

export function Start({ total, onStart, onStickers, onSettings }: { total: number; onStart: () => void; onStickers: () => void; onSettings: () => void }) {
  const deco = useMemo(
    () => Array.from({ length: 14 }, (_, k) => ({
      e: DECO[k % DECO.length], left: Math.random() * 92, top: Math.random() * 90,
      fs: 26 + Math.random() * 28, dur: 3 + Math.random() * 3, dl: Math.random() * 5, rot: Math.random() * 40 - 20,
    })),
    [],
  )
  let i = 0
  return (
    <div className={cx('start')}>
      <div className={cx('deco')} aria-hidden="true">
        {deco.map((d, k) => (
          <span key={k} style={{ left: d.left + '%', top: d.top + '%', '--fs': d.fs + 'px', '--dur': d.dur + 's', '--dl': -d.dl + 's', '--rot': d.rot + 'deg' } as CSSProperties}>{d.e}</span>
        ))}
      </div>
      <Tap className={cx('icon small start-set')} aria-label="어른 설정" onTap={onSettings}>⚙️</Tap>
      <div className={cx('maker')}>💛 든든이 교육 게임</div>
      <h1 className={cx('title')} aria-label={TITLE}>
        {[...TITLE].map((ch, k) => (ch === ' ' ? <span key={k} className={cx('sp')} /> : <span key={k} style={{ '--i': i++ } as CSSProperties}>{ch}</span>))}
      </h1>
      <Tap className={cx('hero')} aria-label="든든이" onTap={() => { sfx.boing(); say('hello') }}>
        <Dundun mood="happy" wave />
      </Tap>
      <Tap className={cx('big-btn bounce')} onTap={onStart}>▶ 시작</Tap>
      <div className={cx('start-row')}>
        <Tap className={cx('big-btn soft')} aria-label="스티커 모음판" onTap={onStickers}>
          <StarSticker style={{ width: 48, height: 48 }} /> {total}
        </Tap>
      </div>
    </div>
  )
}

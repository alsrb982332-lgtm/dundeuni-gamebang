import { cx } from '../cx'
import type { CSSProperties } from 'react'
import { Tap } from '../../../shared/Tap'
import { EmotionFace, Glyph, WeatherIcon } from '../../../shared/art/Art'
import { EMOTIONS, type EmotionId, type Action } from '../data/emotions'

export function EmotionCard({ id, state, hi, hint, onTap }: { id: EmotionId; state?: 'right' | 'wobble'; hi?: boolean; hint?: boolean; onTap: () => void }) {
  const e = EMOTIONS[id]
  return (
    <Tap
      className={cx('ecard' + (state ? ' ' + (state === 'right' ? 'correct' : state) : '') + (hi ? ' hi' : '') + (hint ? ' hint' : ''))}
      style={{ '--eb': e.bg, '--ed': e.deep, borderRadius: e.shape } as CSSProperties}
      aria-label={e.name}
      onTap={onTap}
    >
      <span className={cx('wx')}><WeatherIcon w={e.weather} /></span>
      <EmotionFace mood={e.mood} className={cx('fc')} />
      <span className={cx('lb')}>{e.name}</span>
    </Tap>
  )
}

export function ActionCard({ a, state, hi, hint, onTap }: { a: Action; state?: 'good' | 'wobble'; hi?: boolean; hint?: boolean; onTap: () => void }) {
  return (
    <Tap className={cx('acard' + (state ? ' ' + state : '') + (hi ? ' hi' : '') + (hint ? ' hint' : ''))} aria-label={a.label} onTap={onTap}>
      <Glyph icon={a.icon} className={cx('ai')} />
      <span className={cx('lb')}>{a.label}</span>
    </Tap>
  )
}

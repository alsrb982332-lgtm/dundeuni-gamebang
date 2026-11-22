import type { CSSProperties } from 'react'
import { Dundun } from './art/Art'
import type { Mood } from './art/svg'

/* 마스코트 든든이 (오리지널 초록 아기 공룡)
   표정: 기본 · 기쁨 · 놀람 · 응원 · 잠 */
export type Expression = 'basic' | 'joy' | 'surprise' | 'cheer' | 'sleep'

const MAP: Record<Expression, { mood: Mood; wave: boolean }> = {
  basic: { mood: 'neutral', wave: false },
  joy: { mood: 'joy', wave: false },
  surprise: { mood: 'surprised', wave: false },
  cheer: { mood: 'happy', wave: true },
  sleep: { mood: 'sleepy', wave: false },
}

export function Dundeuni({ face = 'basic', className, style }: { face?: Expression; className?: string; style?: CSSProperties }) {
  const m = MAP[face]
  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', ...style }}>
      <Dundun mood={m.mood} wave={m.wave} style={{ width: '100%', height: '100%', display: 'block' }} />
      {face === 'sleep' && <span aria-hidden="true" style={{ position: 'absolute', right: '4%', top: '-6%', fontSize: '1.4em' }}>💤</span>}
    </span>
  )
}

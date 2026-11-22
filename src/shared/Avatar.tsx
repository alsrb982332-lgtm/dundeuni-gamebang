import type { CSSProperties } from 'react'
import { Friend, PALETTE } from './art/Art'
import type { Mood } from './art/svg'
import { useSettings, type Role } from './settings'

/* 형·동생 아바타 (동물·색은 부모 설정에서 바꿈. 사진은 쓰지 않음) */
export function Avatar({ role, mood = 'happy', wave, className, style }: { role: Role; mood?: Mood; wave?: boolean; className?: string; style?: CSSProperties }) {
  const s = useSettings()
  const a = s.avatars[role]
  return <Friend kind={a.kind} color={PALETTE[a.color]} mood={mood} wave={wave} className={className} style={style} />
}

import { cx } from '../cx'
import type { CSSProperties } from 'react'
import { Dundun, Friend, Glyph, KIND_COLORS, PALETTE, WeatherIcon, type Kind, type Mood, type Weather } from '../../../shared/art/Art'
import type { Situation } from '../data/emotions'
import { settingsStore } from '../../../shared/settings'
import { isAdult } from '../../../shared/art/svg'
import { WeatherFx } from './WeatherFx'

/* 상황 장면: 배경 + 친구 + 소품(그림 문자) + 든든이
   상황에 형·동생이 나오면 게임방 설정의 아바타(동물·색)로 그림 */
export function resolveChar(friend: string): { kind: Kind; color?: { b: string; d: string; l: string } } {
  const av = settingsStore.get().avatars
  if (friend === '형') return { kind: av.hyeong.kind, color: PALETTE[av.hyeong.color] }
  if (friend === '동생') return { kind: av.dong.kind, color: PALETTE[av.dong.color] }
  return { kind: (friend in KIND_COLORS ? friend : 'bunny') as Kind }
}

type Props = {
  sit: Situation
  friendMood: Mood
  badge: 'q' | Weather | null
  dundunMood: Mood
  nope?: boolean
  cheer?: boolean
  onTap?: () => void
  fx?: Weather | null // 맞혔을 때 장면 전체에 나오는 날씨 효과
}

export function Scene({ sit, friendMood, badge, dundunMood, nope, cheer, onTap, fx }: Props) {
  const ch = resolveChar(sit.friend)
  const adult = isAdult(ch.kind)
  return (
    <div className={cx('scene bg-' + (sit.bg || 'room'))} onPointerUp={onTap} role="img" aria-label={sit.story}>
      <div className={cx('ground')} />
      {(sit.others || []).map((o, i) => {
        const oc = resolveChar(o.kind)
        return (
          <div key={i} className={cx('char other a-' + (o.anim || 'none') + (o.big || isAdult(oc.kind) ? ' big' : ''))} style={{ left: (o.x ?? 70) + '%' } as CSSProperties}>
            <Friend kind={oc.kind} color={oc.color} mood={cheer ? 'happy' : o.mood || 'neutral'} />
          </div>
        )
      })}
      <div className={cx('char main' + (adult ? ' adult' : '') + (nope ? ' nope' : '') + (cheer ? ' cheer' : ''))} style={{ left: '38%' }}>
        {badge && (
          <div className={cx('badge')} key={String(badge)}>
            {badge === 'q' ? <span className={cx('qmark')}>?</span> : <WeatherIcon w={badge} />}
          </div>
        )}
        <Friend kind={ch.kind} color={ch.color} mood={friendMood} wave={cheer} />
      </div>
      {(sit.props || []).map((p, i) => (
        <span
          key={i}
          className={cx('prop a-' + (p.anim || 'pop'))}
          style={{ left: (p.x ?? 62) + '%', top: (p.y ?? 50) + '%', fontSize: `calc(var(--sh) * ${(p.size ?? 1) * 0.2})`, '--i': i } as CSSProperties}
        >
          <Glyph icon={p.e} />
        </span>
      ))}
      {fx && <WeatherFx key={fx} w={fx} />}
      <div className={cx('dun' + (cheer ? ' cheer' : ''))}>
        <Dundun mood={dundunMood} />
      </div>
    </div>
  )
}

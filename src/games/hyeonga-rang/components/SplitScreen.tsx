import { cx } from '../cx'
import type { CSSProperties, ReactNode, PointerEvent as RPE } from 'react'
import { Dundun, Friend, PALETTE } from '../../../shared/art/Art'
import type { Role, Settings } from '../progress'
import type { Press } from '../useMultiTouch'

/* 놀이 공통 정보 */
export type PlayCtx = {
  names: Record<Role, string> // 화면에 보이는 이름 (혼자 모드에서 든든이 쪽은 '든든이')
  colors: Record<Role, { b: string; d: string; l: string }>
  bot: Role | null // 든든이가 자동으로 맡는 쪽
  syncMs: number
  settings: Settings
}

export function makeCtx(s: Settings, bot: Role | null): PlayCtx {
  const hy = s.hyeong.trim() || '형'
  const dn = s.dongsaeng.trim() || '동생'
  return {
    names: { hyeong: bot === 'hyeong' ? '든든이' : hy, dong: bot === 'dong' ? '든든이' : dn },
    colors: { hyeong: PALETTE[s.hyeongColor] || PALETTE.sky, dong: PALETTE[s.dongColor] || PALETTE.lime },
    bot,
    syncMs: 0, // 번갈아 누르기라 시간 제한 없음
    settings: s,
  }
}

export function Avatar({ role, ctx, wave, mood = 'happy' }: { role: Role; ctx: PlayCtx; wave?: boolean; mood?: 'happy' | 'joy' | 'neutral' }) {
  if (ctx.bot === role) return <Dundun mood={mood} wave={wave} className={cx('avatar dun-avatar')} />
  return <Friend kind={role === 'hyeong' ? ctx.settings.hyeongKind : ctx.settings.dongKind} color={ctx.colors[role]} mood={mood} wave={wave} className={cx('avatar')} />
}

export type ZoneView = { content?: ReactNode; dim?: boolean; glow?: boolean; wave?: boolean; shake?: boolean; mood?: 'happy' | 'joy' | 'neutral' }

type Props = {
  ctx: PlayCtx
  zone: (r: Role) => ZoneView
  onPress: (p: Press) => void
  center: ReactNode
  header?: ReactNode
}

/* 화면을 형 구역 / 가운데 / 동생 구역으로 나눔 (세로 화면이면 위·가운데·아래) */
export function SplitScreen({ ctx, zone, onPress, center, header }: Props) {
  const down = (role: Role) => (e: RPE<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const t = e.target as Element
    onPress({ role, onButton: !!t.closest('[data-act]'), at: performance.now(), target: t })
  }
  const render = (role: Role) => {
    const z = zone(role)
    const c = ctx.colors[role]
    return (
      <div
        className={cx('zone z-' + role + (z.dim ? ' dim' : '') + (z.glow ? ' glow' : '') + (z.shake ? ' shake' : ''))}
        style={{ '--zb': c.l, '--zc': c.b, '--zd': c.d } as CSSProperties}
        onPointerDown={down(role)}
      >
        <div className={cx('zone-head')}>
          <Avatar role={role} ctx={ctx} wave={z.wave} mood={z.mood} />
          <span className={cx('zname')}>{ctx.names[role]}</span>
        </div>
        <div className={cx('zone-body')}>{z.content}</div>
      </div>
    )
  }
  return (
    <div className={cx('split hy-' + ctx.settings.hyeongSide)}>
      {render('hyeong')}
      <div className={cx('center')}>
        {header}
        <div className={cx('stage')}>{center}</div>
      </div>
      {render('dong')}
    </div>
  )
}

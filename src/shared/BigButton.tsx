import type { CSSProperties, ReactNode } from 'react'
import { Tap } from './Tap'
import css from './shared.module.css'

/* 유아용 큰 버튼 (최소 96px, coop 이면 120px) */
export function BigButton({ children, onTap, soft, coop, bounce, className, style, label }: {
  children: ReactNode; onTap: () => void; soft?: boolean; coop?: boolean; bounce?: boolean; className?: string; style?: CSSProperties; label?: string
}) {
  const cls = [css.big, soft && css.soft, coop && css.coop, bounce && css.bounce, className].filter(Boolean).join(' ')
  return <Tap className={cls} style={style} aria-label={label} onTap={() => onTap()}>{children}</Tap>
}

/* 큰 그림 카드 (글자는 보조) */
export function Card({ art, label, onTap, glow, dim, badge, className, style }: {
  art: ReactNode; label: string; onTap: () => void; glow?: boolean; dim?: boolean; badge?: ReactNode; className?: string; style?: CSSProperties
}) {
  const cls = [css.card, glow && css.glow, dim && css.dim, className].filter(Boolean).join(' ')
  return (
    <Tap className={cls} style={style} aria-label={label} onTap={() => onTap()}>
      <span className={css.cardArt}>{art}</span>
      <span className={css.cardLabel}>{label}</span>
      {badge && <span className={css.badge}>{badge}</span>}
    </Tap>
  )
}

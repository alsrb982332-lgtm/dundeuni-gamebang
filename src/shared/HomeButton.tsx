import { Tap } from './Tap'
import css from './shell.module.css'

/* 「집으로 가기」 — 모든 게임 화면 왼쪽 위 같은 자리에 떠 있는 작은 버튼. 한 번 누르면 게임방으로 */
export function HomeButton({ onHome }: { onHome: () => void }) {
  return (
    <Tap className={css.home} aria-label="게임방으로" onTap={onHome}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className={css.homeIcon}>
        <path d="M8 23 L24 9 L40 23" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 21 V38 a2 2 0 0 0 2 2 H21 V30 H27 V40 H33 a2 2 0 0 0 2 -2 V21" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Tap>
  )
}

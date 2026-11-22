import { useRef, useState, type CSSProperties } from 'react'
import { say } from './useVoice'
import css from './shell.module.css'

/* 「집으로 가기」 — 모든 게임 화면 왼쪽 위 같은 자리.
   아이가 실수로 누르지 않게 1초 길게 눌러야 동작 (게임방에서 유일하게 길게 누르기를 쓰는 곳)
   짧게 누르면 「꾹 누르고 있어 봐」 안내만 */
export const HOLD_MS = 1000

export function HomeButton({ onHome }: { onHome: () => void }) {
  const [holding, setHolding] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fired = useRef(false)
  const nagAt = useRef(0)

  const start = () => {
    fired.current = false
    setHolding(true)
    t.current = setTimeout(() => {
      t.current = null
      fired.current = true
      setHolding(false)
      onHome()
    }, HOLD_MS)
  }
  const end = () => {
    if (t.current) {
      clearTimeout(t.current)
      t.current = null
      if (!fired.current && performance.now() - nagAt.current > 2500) {
        nagAt.current = performance.now()
        void say('home_hold')
      }
    }
    setHolding(false)
  }

  return (
    <button
      type="button"
      className={css.home + (holding ? ' ' + css.holding : '')}
      style={{ '--hold': HOLD_MS + 'ms' } as CSSProperties}
      aria-label="집으로 가기 (길게 누르기)"
      onPointerDown={(e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ } start() }}
      onPointerUp={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHome() } }}
    >
      <svg className={css.ring} viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" /></svg>
      <span className={css.homeIcon} aria-hidden="true">🏠</span>
    </button>
  )
}

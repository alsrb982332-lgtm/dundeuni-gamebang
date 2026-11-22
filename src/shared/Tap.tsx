import { useRef, type ButtonHTMLAttributes, type PointerEvent as RPE } from 'react'

/* 아이용 누르기 버튼
   - 브라우저의 click 대신 pointer 이벤트로 직접 판단해서,
     손바닥이 화면에 닿아 있거나 다른 손가락이 눌려 있어도 정확히 눌림.
   - fire="down": 손가락이 닿는 순간 바로 동작 (동시에 누르기 게임용)
   - fire="up": 손을 뗄 때 동작, 손가락이 조금 미끄러져도 괜찮음 (기본) */
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onTap?: (e: RPE<HTMLButtonElement> | null) => void
  fire?: 'down' | 'up'
}

const SLOP = 40 // 버튼 밖으로 이만큼(px) 미끄러져도 눌린 것으로 인정

export function Tap({ onTap, fire = 'up', className, disabled, children, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const active = useRef<Set<number>>(new Set())

  const press = (on: boolean) => ref.current?.classList.toggle('pressing', on)

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      disabled={disabled}
      {...rest}
      onPointerDown={(e) => {
        if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
        if (fire === 'down') {
          press(true)
          setTimeout(() => press(false), 140)
          onTap?.(e)
          return
        }
        active.current.add(e.pointerId)
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 무시 */ }
        press(true)
      }}
      onPointerUp={(e) => {
        if (!active.current.delete(e.pointerId)) return
        press(false)
        const r = e.currentTarget.getBoundingClientRect()
        const inside =
          e.clientX >= r.left - SLOP && e.clientX <= r.right + SLOP && e.clientY >= r.top - SLOP && e.clientY <= r.bottom + SLOP
        if (inside && !disabled) onTap?.(e)
      }}
      onPointerCancel={(e) => {
        active.current.delete(e.pointerId)
        press(false)
      }}
      onClick={(e) => {
        /* 키보드(Enter/Space)로 누른 경우만 여기서 처리 */
        if (e.detail === 0 && !disabled) onTap?.(null)
      }}
    >
      {children}
    </button>
  )
}

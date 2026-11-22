import { useEffect, useRef } from 'react'
import type { Role } from './progress'

/* 형/동생 구역 누르기를 한 곳에서 받기
   - 화면: 구역마다 pointerdown (손가락마다 따로 들어오므로 둘이 동시에 눌러도 둘 다 인식)
   - 키보드 디버그: A = 형, L = 동생 (PC에서 시험할 때) */
export type Press = { role: Role; onButton: boolean; at: number; target?: Element }

export function useKeyboardPress(onPress: (p: Press) => void) {
  const ref = useRef(onPress)
  ref.current = onPress
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'a') ref.current({ role: 'hyeong', onButton: true, at: performance.now() })
      if (k === 'l') ref.current({ role: 'dong', onButton: true, at: performance.now() })
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])
}

/* 번갈아 누르기 판정 (태블릿은 두 손가락 동시 입력이 잘 안 돼서, 동시에가 아니라 한 사람씩)
   - 한 사람이 누르면 그쪽은 「눌렀음」으로 기다리고, 곧바로 onLonely(누른 사람) → 「이제 ○○ 차례!」 안내
   - 다른 사람이 누르면(시간 제한 없음) onBoth → 함께 해냄
   - 같은 사람이 또 누르면 그대로 기다림 */
export function makeSync(opts: { windowMs?: () => number; onBoth: () => void; onLonely: (who: Role) => void; onArm?: (who: Role, on: boolean) => void }) {
  const armed: Record<Role, boolean> = { hyeong: false, dong: false }
  const clear = () => {
    for (const r of ['hyeong', 'dong'] as Role[]) {
      armed[r] = false
      opts.onArm?.(r, false)
    }
  }
  return {
    press(r: Role, _at?: number) {
      const o: Role = r === 'hyeong' ? 'dong' : 'hyeong'
      if (armed[o]) {
        clear()
        opts.onBoth()
        return
      }
      if (armed[r]) return
      armed[r] = true
      opts.onArm?.(r, true)
      opts.onLonely(r)
    },
    clear,
    armed: (r: Role) => armed[r],
  }
}

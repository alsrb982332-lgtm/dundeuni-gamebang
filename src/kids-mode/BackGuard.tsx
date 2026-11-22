import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router'

/* 뒤로 가기 막기 (브라우저·안드로이드 뒤로 가기 버튼)
   - 앱 안에서는 화면을 옮길 때 항상 「바꾸기(replace)」만 해서 방문 기록이 늘지 않게 함 (useGo)
   - 처음 켤 때 같은 주소를 하나 더 쌓아 둠 → 뒤로 가기를 누르면 앱이 닫히지 않고 그 칸으로 내려옴
   - 내려온 것(POP)을 알아차리면: 게임방 메인으로 옮기고 칸을 다시 쌓음 */

export const backTarget = (path: string) => (path === '/' ? '/' : '/main')

export function BackGuard() {
  const loc = useLocation()
  const type = useNavigationType()
  const nav = useNavigate()
  const prev = useRef<string | null>(null)

  useEffect(() => {
    const here = loc.pathname
    if (prev.current === null) {
      prev.current = here
      const st = window.history.state as { usr?: { guard?: boolean } } | null
      if (!st?.usr?.guard) nav(here, { state: { guard: true } })
      return
    }
    if (type === 'POP') {
      const target = backTarget(prev.current)
      prev.current = target
      nav(target, { replace: true })
      nav(target, { state: { guard: true } })
      return
    }
    prev.current = here
  }, [loc.key]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

/** 앱 안 화면 이동 (방문 기록을 늘리지 않음) */
export function useGo() {
  const nav = useNavigate()
  return (path: string) => nav(path, { replace: true, state: { guard: true } })
}

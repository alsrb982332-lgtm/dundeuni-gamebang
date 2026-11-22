import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { playTimeStore, tick } from '../parent/playtime'
import { keepAwake } from './device'

/* 게임 화면에 있는 동안 놀이 시간을 세고, 화면이 꺼지지 않게 함 */
export function PlayClock() {
  const { pathname } = useLocation()
  const inGame = pathname.startsWith('/play/')
  const ref = useRef(inGame)
  ref.current = inGame

  useEffect(() => { void keepAwake(inGame) }, [inGame])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const p = playTimeStore.get()
      const n = tick(p, new Date(), ref.current)
      if (n !== p) playTimeStore.set(n)
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return null
}

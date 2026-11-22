import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { registerSW } from 'virtual:pwa-register'

/* 업데이트 안전
   - 새 버전이 배포되면 몰래 받아 두기만 하고 (게임 중에 갑자기 새로고침하지 않음)
   - 아이가 게임방 메인(또는 시작 화면)에 있을 때 조용히 새 버전으로 바꿈 */
let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null
let waiting = false
const subs = new Set<() => void>()

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() { waiting = true; subs.forEach((f) => f()) },
    onRegisteredSW(_url, reg) {
      /* 앱을 오래 켜 두는 태블릿: 1시간마다 새 버전 확인 */
      if (reg) setInterval(() => { void reg.update().catch(() => {}) }, 60 * 60 * 1000)
    },
  })
}

const SAFE = ['/', '/main']

export function UpdateWatcher() {
  const { pathname } = useLocation()
  const [ready, setReady] = useState(waiting)
  useEffect(() => {
    const f = () => setReady(true)
    subs.add(f)
    return () => { subs.delete(f) }
  }, [])
  useEffect(() => {
    if (ready && SAFE.includes(pathname) && applyUpdate) void applyUpdate(true)
  }, [ready, pathname])
  return null
}

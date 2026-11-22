/* 기기 판별 + 전체 화면 + 화면 꺼짐 방지 */

export type DeviceKind = 'android' | 'ipad' | 'iphone' | 'other'

export function deviceKind(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints || 0): DeviceKind {
  if (/android/i.test(ua)) return 'android'
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'ipad' // 아이패드OS 는 맥처럼 보임
  if (/iPhone|iPod/.test(ua)) return 'iphone'
  return 'other'
}

export const isStandalone = () =>
  matchMedia('(display-mode: fullscreen)').matches ||
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** 안드로이드: 시작 버튼을 누를 때 전체 화면 요청 (아이폰·아이패드는 지원 안 함 → 홈 화면에 추가로 해결) */
export function requestAppFullscreen() {
  try {
    const kind = deviceKind()
    if (kind === 'ipad' || kind === 'iphone') return
    if (document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches) return
    void document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {})
  } catch { /* 무시 */ }
}

/* ---------- 화면 꺼짐 방지 (Screen Wake Lock, 지원 기기만) ---------- */
let sentinel: WakeLockSentinel | null = null
let want = false

export async function keepAwake(on: boolean) {
  want = on
  try {
    if (on) {
      if (sentinel || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return
      sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener('release', () => { sentinel = null })
    } else if (sentinel) {
      const s = sentinel
      sentinel = null
      await s.release()
    }
  } catch { /* 배터리 절약 모드 등: 무시 */ }
}

if (typeof document !== 'undefined') {
  /* 다른 앱에 갔다 오면 다시 켬 */
  document.addEventListener('visibilitychange', () => { if (want && document.visibilityState === 'visible') void keepAwake(true) })
}

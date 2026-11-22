import { cx } from '../cx'
import { useEffect, useState } from 'react'

/* 누른 자리에 동그라미가 퍼짐 (아이에게 '눌렸다'는 느낌을 줌).
   디버그 모드에서는 손가락 번호와 누른 기록도 보여 줌 */
type Dot = { id: number; x: number; y: number; p: number }
let seq = 0

export function TouchRipple({ debug }: { debug: boolean }) {
  const [dots, setDots] = useState<Dot[]>([])
  const [log, setLog] = useState<string[]>([])
  const [active, setActive] = useState(0)
  useEffect(() => {
    const ids = new Set<number>()
    const down = (e: PointerEvent) => {
      ids.add(e.pointerId)
      setActive(ids.size)
      const d = { id: ++seq, x: e.clientX, y: e.clientY, p: e.pointerId }
      setDots((a) => [...a.slice(-12), d])
      setTimeout(() => setDots((a) => a.filter((x) => x.id !== d.id)), 650)
      if (debug) setLog((l) => [`${(performance.now() / 1000).toFixed(2)}s 손가락#${e.pointerId} (${Math.round(e.clientX)},${Math.round(e.clientY)})`, ...l].slice(0, 6))
    }
    const up = (e: PointerEvent) => { ids.delete(e.pointerId); setActive(ids.size) }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('pointerup', up, true)
    document.addEventListener('pointercancel', up, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('pointerup', up, true)
      document.removeEventListener('pointercancel', up, true)
    }
  }, [debug])
  return (
    <>
      {dots.map((d) => (
        <span key={d.id} className={cx('ripple')} style={{ left: d.x, top: d.y }}>{debug ? d.p : ''}</span>
      ))}
      {debug && (
        <div className={cx('debug-box')}>
          <b>디버그</b> 지금 닿은 손가락: {active}개 · 키보드 A = 형, L = 동생
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Dundeuni } from '../shared/Dundeuni'
import { guardFrame, hushFrame } from '../kids-mode/frameGuard'
import type { LegacyGame } from './registry'
import css from '../shared/shell.module.css'

/* 1단계 게임: public/legacy/<id>/index.html 을 게임 화면 안에 그대로 띄움
   (같은 주소라 오프라인 저장·기록이 게임방과 함께 동작) */
export function LegacyFrame({ game }: { game: LegacyGame }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const f = ref.current
    return () => hushFrame(f)
  }, [])

  return (
    <>
      <iframe
        ref={ref}
        className={css.frame}
        src={import.meta.env.BASE_URL + game.src}
        title={game.name}
        allow="autoplay; microphone; fullscreen; screen-wake-lock"
        onLoad={(e) => { guardFrame(e.currentTarget); setReady(true); try { e.currentTarget.contentWindow?.focus() } catch { /* 무시 */ } }}
      />
      {!ready && <div className={css.loading}><Dundeuni face="cheer" /></div>}
    </>
  )
}

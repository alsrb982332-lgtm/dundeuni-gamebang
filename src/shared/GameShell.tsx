import { useEffect, useState, type ReactNode } from 'react'
import { HomeButton } from './HomeButton'
import { Dundeuni } from './Dundeuni'
import { say, stopVoice } from './useVoice'
import { useSettings } from './settings'
import { sfx } from './sfx'
import { afterRest, isOver, isRestDue, playTimeStore, REST_LEN_SEC } from '../parent/playtime'
import css from './shell.module.css'

/* 게임 공통 틀
   - 왼쪽 위(가로 화면은 왼쪽 줄, 세로 화면은 위쪽 줄)에 「집으로 가기」
   - 놀이 시간이 끝나면 onTimeUp (→ 「든든이가 졸려요」 화면)
   - 연속 10분 놀면 30초 쉬는 시간 (부모 설정에서 끌 수 있음)
   - 권장 방향과 다르면 「태블릿을 돌려 볼까?」 */
type Props = {
  children: ReactNode
  onHome: () => void
  onTimeUp: () => void
  orientation?: 'landscape' | 'portrait' | 'any'
  color?: string
}

export function GameShell({ children, onHome, onTimeUp, orientation = 'any', color }: Props) {
  const s = useSettings()
  const pt = playTimeStore.use()
  const over = isOver(pt, s.dailyLimitMin)
  const rest = isRestDue(pt, s.restReminder)

  useEffect(() => { if (over) onTimeUp() }, [over]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={css.shell} style={color ? { ['--kc' as string]: color } : undefined}>
      <nav className={css.rail}>
        <HomeButton onHome={() => { stopVoice(); onHome() }} />
      </nav>
      <div className={css.stage}>{children}</div>
      {rest && <RestBreak />}
      {orientation !== 'any' && <RotateHint want={orientation} />}
    </div>
  )
}

/* 쉬는 시간: 30초 동안 든든이랑 눈 감기, 끝나면 저절로 다시 놀기 */
function RestBreak() {
  const [left, setLeft] = useState(REST_LEN_SEC)
  useEffect(() => {
    void say('rest')
    const end = Date.now() + REST_LEN_SEC * 1000
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setLeft(l)
      if (l <= 0) {
        clearInterval(t)
        sfx.ding()
        void say('rest_done')
        playTimeStore.set(afterRest)
      }
    }, 250)
    return () => clearInterval(t)
  }, [])
  return (
    <div className={css.cover} role="dialog" aria-label="쉬는 시간">
      <Dundeuni face="sleep" className={css.coverPic} />
      <p className={css.coverText}>눈을 감고 쉬어 볼까?</p>
      <div className={css.restDots} aria-label={`${left}초`}>
        {Array.from({ length: 6 }, (_, i) => <i key={i} className={left <= REST_LEN_SEC - (i + 1) * 5 ? css.on : ''} />)}
      </div>
    </div>
  )
}

/* 권장 방향 안내 (어른은 「그냥 할래요」로 넘길 수 있음) */
function RotateHint({ want }: { want: 'landscape' | 'portrait' }) {
  const q = `(orientation: ${want === 'landscape' ? 'portrait' : 'landscape'})`
  const [wrong, setWrong] = useState(() => matchMedia(q).matches)
  const [skip, setSkip] = useState(false)
  useEffect(() => {
    const m = matchMedia(q)
    const f = () => setWrong(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [q])
  useEffect(() => { if (wrong && !skip) void say('rotate') }, [wrong, skip])
  if (!wrong || skip) return null
  return (
    <div className={css.cover} role="dialog" aria-label="태블릿을 돌려 볼까?">
      <svg viewBox="0 0 200 140" className={css.rotatePic} aria-hidden="true">
        <rect x="70" y="10" width="60" height="96" rx="10" fill="var(--sheet)" stroke="#3B3651" strokeWidth="4" />
        <g className={css.rotateSpin}>
          <rect x="52" y="34" width="96" height="60" rx="10" fill="#E4F7D8" stroke="#56B266" strokeWidth="4" strokeDasharray="8 6" />
        </g>
        <path d="M160 40 a40 40 0 0 1 0 50" fill="none" stroke="#EE8420" strokeWidth="5" strokeLinecap="round" />
        <path d="M152 88 l10 4 2 -11" fill="none" stroke="#EE8420" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className={css.coverText}>태블릿을 돌려 볼까?</p>
      <button type="button" className={css.skip} onClick={() => setSkip(true)}>그냥 할래요 (어른)</button>
    </div>
  )
}

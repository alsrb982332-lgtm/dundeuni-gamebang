import { useEffect, useState, type ReactNode } from 'react'
import { HomeButton } from './HomeButton'
import { Dundeuni } from './Dundeuni'
import { say, stopVoice } from './useVoice'
import { useSettings } from './settings'
import { sfx } from './sfx'
import { afterRest, isOver, isRestDue, playTimeStore, REST_LEN_SEC } from '../parent/playtime'
import css from './shell.module.css'

/* 게임 공통 틀 (세로 태블릿 기준)
   - 게임이 화면 전체를 씀. 왼쪽 위에 작은 「집으로 가기」 버튼만 떠 있음 (한 번 누르면 게임방으로)
   - 놀이 시간이 끝나면 onTimeUp (→ 「든든이가 졸려요」 화면)
   - 연속 10분 놀면 30초 쉬는 시간 (부모 설정에서 끌 수 있음) */
type Props = {
  children: ReactNode
  onHome: () => void
  onTimeUp: () => void
  color?: string
}

export function GameShell({ children, onHome, onTimeUp, color }: Props) {
  const s = useSettings()
  const pt = playTimeStore.use()
  const over = isOver(pt, s.dailyLimitMin)
  const rest = isRestDue(pt, s.restReminder)

  useEffect(() => { if (over) onTimeUp() }, [over]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={css.shell} style={color ? { ['--kc' as string]: color } : undefined}>
      <div className={css.stage}>{children}</div>
      <HomeButton onHome={() => { stopVoice(); onHome() }} />
      {rest && <RestBreak />}
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

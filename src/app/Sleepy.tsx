import { useEffect, useState } from 'react'
import { Dundeuni } from '../shared/Dundeuni'
import { BigButton } from '../shared/BigButton'
import { Tap } from '../shared/Tap'
import { useSettings } from '../shared/settings'
import { say } from '../shared/useVoice'
import { useGo } from '../kids-mode/BackGuard'
import { addMinutes, isOver, playTimeStore, unlockToday } from '../parent/playtime'
import { ParentGate } from '../parent/ParentGate'
import css from './app.module.css'

/* 「든든이가 졸려요. 오늘은 여기까지!」 — 놀이 시간이 끝나면. 부모 확인으로만 풀림 */
export function Sleepy() {
  const go = useGo()
  const s = useSettings()
  const pt = playTimeStore.use()
  const [gate, setGate] = useState(false)
  const [menu, setMenu] = useState(false)
  useEffect(() => { const t = setTimeout(() => void say('sleepy'), 300); return () => clearTimeout(t) }, [])
  useEffect(() => { if (!isOver(pt, s.dailyLimitMin)) go('/main') }, [pt, s.dailyLimitMin]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className={css.page}>
      <Dundeuni face="sleep" className={css.hero} />
      <h2 className={css.bigText}>든든이가 졸려요.<br />오늘은 여기까지!</h2>
      <BigButton soft onTap={() => go('/main')}>🏠 게임방으로</BigButton>
      <Tap className={css.cornerBtn} aria-label="어른이 풀기" onTap={() => setGate(true)}>🔓 어른</Tap>
      {gate && <ParentGate why="놀이 시간을 늘리려면 어른 확인이 필요해요." onClose={() => setGate(false)} onPass={() => { setGate(false); setMenu(true) }} />}
      {menu && (
        <div className="overlay" role="dialog" aria-label="놀이 시간 풀기">
          <div className="sheet gate">
            <h2>놀이 시간</h2>
            <p className="note">오늘 정한 시간이 끝났어요. 어떻게 할까요?</p>
            <div className="start-row">
              <Tap className="toolbtn" onTap={() => { playTimeStore.set((p) => addMinutes(p, 10)); setMenu(false) }}>⏱️ 10분 더</Tap>
              <Tap className="toolbtn" onTap={() => { playTimeStore.set((p) => unlockToday(p)); setMenu(false) }}>🔓 오늘은 제한 없이</Tap>
              <Tap className="toolbtn" onTap={() => setMenu(false)}>닫기</Tap>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

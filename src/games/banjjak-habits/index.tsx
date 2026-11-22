import { useEffect, useState } from 'react'
import type { GameProps } from '../registry'
import { isOn, moveLegacyStars, useProgress } from './progress'
import { registerLines, stopVoice } from '../../shared/useVoice'
import { unlockAudio } from '../../shared/sfx'
import { useProfile } from '../../shared/useProfile'
import { HABITS, type Habit } from './data/habits'
import { ParentGate } from '../../parent/ParentGate'
import { Start, ModeSelect, HabitSelect } from './screens/Menus'
import { Play, type Mode } from './screens/Play'
import { Complete } from './screens/After'
import { Finish, Board, SettingsPanel } from './screens/Records'
import { css, cx } from './cx'
import VOICE from './data/voice.json'

/* ✨ 반짝반짝 습관 놀이 — 생활 습관 순서 놀이 (2단계: 게임방 안으로 옮김)
   기준: docs/03_생활습관놀이_앱제작의뢰서.md · 원본: legacy/banjjak-habits/
   2차 개선: 아침·낮·저녁으로 묶기, 단계마다 문지르기·옮기기, 습관마다 다른 배경, 「진짜로 해 볼까」 대신 습관을 더 넣음 */
registerLines(VOICE, '반짝반짝 습관 놀이')

type Screen =
  | { s: 'start' } | { s: 'mode' } | { s: 'habit'; mode: Mode }
  | { s: 'play'; mode: Mode; habit: Habit; n: number } | { s: 'complete'; mode: Mode; habit: Habit }
  | { s: 'finish'; mode: Mode } | { s: 'board' }

export default function BanjjakHabits({ onExit }: GameProps) {
  const { settings, setSettings, records, add, reset, totals, today } = useProgress()
  const { who } = useProfile()
  const [screen, setScreen] = useState<Screen>({ s: 'start' })
  const [panel, setPanel] = useState<'none' | 'gate' | 'settings'>('none')

  useEffect(() => { moveLegacyStars() }, [])

  const go = (n: Screen) => { stopVoice(); setScreen(n) }
  const startPlay = (m: Mode, h: Habit) => go({ s: 'play', mode: m, habit: h, n: Date.now() })
  const toHabits = (m: Mode) => {
    const th = HABITS.find((h) => h.id === settings.todayHabit && isOn(settings, h.id))
    if (th) startPlay(m, th)
    else go({ s: 'habit', mode: m })
  }
  const begin = () => {
    unlockAudio()
    if (who === 'hyeong' || who === 'dong') toHabits(who)
    else go({ s: 'mode' })
  }

  let view = null
  switch (screen.s) {
    case 'start':
      view = <Start totals={totals} onStart={begin} onBoard={() => { unlockAudio(); go({ s: 'board' }) }} onSettings={() => setPanel('gate')} />
      break
    case 'mode':
      view = <ModeSelect s={settings} onHome={() => go({ s: 'start' })} onPick={toHabits} />
      break
    case 'habit':
      view = <HabitSelect s={settings} done={today.play} onHome={() => go({ s: 'start' })} onPick={(h) => startPlay(screen.mode, h)} />
      break
    case 'play':
      view = <Play key={screen.n} habit={screen.habit} mode={screen.mode} five={settings.five} drag={settings.drag} onHome={() => go({ s: 'habit', mode: screen.mode })} onDone={() => go({ s: 'complete', mode: screen.mode, habit: screen.habit })} />
      break
    case 'complete':
      view = <Complete habit={screen.habit} onSticker={() => add(screen.habit.id)} onNext={() => go({ s: 'finish', mode: screen.mode })} />
      break
    case 'finish':
      view = <Finish today={today} onHome={onExit} onMore={() => go({ s: 'habit', mode: (screen as { mode: Mode }).mode })} onBoard={() => go({ s: 'board' })} />
      break
    case 'board':
      view = <Board records={records} totals={totals} onBack={() => go({ s: 'start' })} />
      break
  }

  return (
    <div className={cx(css.root)}>
      {view}
      {panel === 'gate' && <ParentGate onPass={() => setPanel('settings')} onClose={() => setPanel('none')} />}
      {panel === 'settings' && <SettingsPanel s={settings} setSettings={setSettings} totals={totals} onReset={reset} onClose={() => setPanel('none')} />}
    </div>
  )
}

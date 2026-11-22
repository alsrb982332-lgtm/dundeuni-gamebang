import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress, type GameId, type Role } from './progress'
import { setVoiceVars, setVoiceVolume, stopVoice } from '../../shared/useVoice'
import { setSfxVolume, unlockAudio } from '../../shared/sfx'
import { makeCtx } from './components/SplitScreen'
import { ParentGate } from '../../parent/ParentGate'
import { TouchRipple } from './components/TouchRipple'
import { Tap } from '../../shared/Tap'
import { StarSticker } from '../../shared/art/Art'
import { Start } from './screens/Start'
import { Players } from './screens/Players'
import { Select, GAMES } from './screens/Select'
import { Celebrate } from './screens/Celebrate'
import { Finish } from './screens/Finish'
import { Board } from './screens/Board'
import { SettingsPanel } from './screens/SettingsPanel'
import { Bridge } from './games/Bridge/Bridge'
import { Tower } from './games/Tower/Tower'
import { Coloring } from './games/Coloring/Coloring'
import { Moving } from './games/Moving/Moving'
import type { GameProps } from '../registry'
import { registerLines } from '../../shared/useVoice'
import { moveLegacyStars } from './progress'
import { css, cx } from './cx'
import VOICE from './data/voice.json'

/* 🐻🐰 형아랑 같이 — 형제 협동 게임 (2단계: 게임방 안으로 옮김)
   기준: docs/02_형아랑같이_앱제작의뢰서.md · 원본: legacy/hyeonga-rang-gachi/
   태블릿은 두 손가락 동시 입력이 잘 안 돼서 「동시에」 대신 「한 사람씩 번갈아」 누르면 함께 해낸 것으로 */
registerLines(VOICE, '형아랑 같이')

type Screen =
  | { s: 'start' } | { s: 'players' } | { s: 'select' } | { s: 'game'; g: GameId; n: number }
  | { s: 'celebrate'; n: number } | { s: 'finish' } | { s: 'board'; back: 'start' | 'finish' }

type Session = { bot: Role | null; startAt: number; played: number; stars: number }

const GAME_VIEW = { bridge: Bridge, tower: Tower, coloring: Coloring, moving: Moving }

export default function HyeongaRang({ onExit }: GameProps) {
  const { settings, setSettings, progress, addStar, reset } = useProgress()
  const [screen, setScreen] = useState<Screen>({ s: 'start' })
  const [panel, setPanel] = useState<'none' | 'gate' | 'settings'>('none')
  const [session, setSession] = useState<Session>({ bot: null, startAt: 0, played: 0, stars: 0 })
  const sessionRef = useRef(session)
  sessionRef.current = session
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const ctx = useMemo(() => makeCtx(settings, session.bot), [settings, session.bot])

  useEffect(() => {
    setVoiceVars({ 형: ctx.names.hyeong, 동생: ctx.names.dong })
  }, [ctx.names.hyeong, ctx.names.dong])
  useEffect(() => { setVoiceVolume(settings.volume); setSfxVolume(settings.volume * 0.9) }, [settings.volume])

  useEffect(() => { moveLegacyStars() }, [])
  const go = (n: Screen) => { stopVoice(); setScreen(n) }

  /* 정한 판 수 또는 시간이 지났는지 */
  const timeUp = () => {
    const s = sessionRef.current
    const st = settingsRef.current
    return (st.maxGames > 0 && s.played >= st.maxGames) || (st.maxMinutes > 0 && Date.now() - s.startAt >= st.maxMinutes * 60000)
  }

  const header = (g: GameId) => {
    const info = GAMES.find((x) => x.id === g)!
    return (
      <div className={cx('cbar')}>
        <Tap className={cx('icon')} aria-label="놀이 고르기로" onTap={() => go({ s: 'select' })}>◀</Tap>
        <span className={cx('ctitle')} style={{ background: info.kc }}>{info.pic} {info.name}</span>
        <span className={cx('stars')}><StarSticker /> {session.stars}</span>
      </div>
    )
  }

  let view = null
  switch (screen.s) {
    case 'start':
      view = <Start s={settings} total={progress.total} onStart={() => { unlockAudio(); go({ s: 'players' }) }} onBoard={() => { unlockAudio(); go({ s: 'board', back: 'start' }) }} onSettings={() => setPanel('gate')} />
      break
    case 'players':
      view = <Players s={settings} onHome={() => go({ s: 'start' })} onPick={(bot) => { setSession({ bot, startAt: Date.now(), played: 0, stars: 0 }); go({ s: 'select' }) }} />
      break
    case 'select':
      view = <Select s={settings} played={session.played} stars={session.stars} onHome={() => go({ s: 'start' })} onEnd={() => go({ s: 'finish' })} onPick={(g) => go({ s: 'game', g, n: Date.now() })} />
      break
    case 'game': {
      const G = GAME_VIEW[screen.g]
      view = <G key={screen.n} ctx={ctx} header={header(screen.g)} onWin={() => go({ s: 'celebrate', n: Date.now() })} />
      break
    }
    case 'celebrate':
      view = (
        <Celebrate
          key={screen.n}
          ctx={ctx}
          onStar={() => { addStar(); setSession((s) => ({ ...s, stars: s.stars + 1 })) }}
          onNext={() => {
            sessionRef.current = { ...sessionRef.current, played: sessionRef.current.played + 1 }
            setSession(sessionRef.current)
            go(timeUp() ? { s: 'finish' } : { s: 'select' })
          }}
        />
      )
      break
    case 'finish':
      view = <Finish ctx={ctx} stars={session.stars} onHome={onExit} onBoard={() => go({ s: 'board', back: 'finish' })} />
      break
    case 'board':
      view = <Board progress={progress} onBack={() => go({ s: 'start' })} />
      break
  }

  return (
    <div className={cx(css.root)}>
      {view}
      <TouchRipple debug={settings.debug} />
      {panel === 'gate' && <ParentGate onPass={() => setPanel('settings')} onClose={() => setPanel('none')} />}
      {panel === 'settings' && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          progress={progress}
          onReset={reset}
          onClose={() => setPanel('none')}
        />
      )}
    </div>
  )
}

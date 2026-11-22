import { useEffect, useState } from 'react'
import type { GameProps } from '../registry'
import { ParentGate } from '../../parent/ParentGate'
import { registerLines, stopVoice } from '../../shared/useVoice'
import { unlockAudio } from '../../shared/sfx'
import { useProfile } from '../../shared/useProfile'
import { stickerStore } from '../../shared/useStickers'
import { todayKey } from '../../shared/storage'
import { addStar, GAME_ID, moveLegacyStars, useMaeumSettings } from './progress'
import { Start } from './screens/Start'
import { ModeSelect } from './screens/ModeSelect'
import { Game, type Mode } from './screens/Game'
import { Finish } from './screens/Finish'
import { Stickers } from './screens/Stickers'
import { SettingsPanel } from './screens/SettingsPanel'
import { css } from './cx'
import VOICE from './data/voice.json'

/* ☀️ 마음 날씨 — 감정·공감 게임 (2단계: 게임방 안으로 옮김)
   기준: docs/01_마음날씨_앱제작의뢰서.md  ·  원본: legacy/maeum-nalssi/
   게임방에서 「누가 놀까」를 형/동생으로 골랐으면 모드 고르기를 건너뜀, 「둘이 같이」면 모드 고르기 */
registerLines(VOICE, '마음 날씨')

type Screen =
  | { s: 'start' }
  | { s: 'mode' }
  | { s: 'game'; mode: Mode; n: number }
  | { s: 'finish'; stars: number }
  | { s: 'stickers' }

export default function MaeumNalssi({ onExit }: GameProps) {
  const settings = useMaeumSettings()
  const { who, names } = useProfile()
  const list = stickerStore.use().list
  const mine = list.filter((x) => x.game === GAME_ID)
  const today = mine.filter((x) => x.day === todayKey()).length
  const [screen, setScreen] = useState<Screen>({ s: 'start' })
  const [panel, setPanel] = useState<'none' | 'gate' | 'settings'>('none')

  useEffect(() => { moveLegacyStars() }, [])

  const go = (n: Screen) => { stopVoice(); setScreen(n) }
  const play = (mode: Mode) => go({ s: 'game', mode, n: Date.now() })
  const start = () => {
    unlockAudio()
    if (who === 'hyeong' || who === 'dong') play(who)
    else go({ s: 'mode' })
  }

  return (
    <div className={css.root}>
      {screen.s === 'start' && (
        <Start total={mine.length} onStart={start} onStickers={() => { unlockAudio(); go({ s: 'stickers' }) }} onSettings={() => setPanel('gate')} />
      )}
      {screen.s === 'mode' && (
        <ModeSelect dong={names.dong} hyeong={names.hyeong} onHome={() => go({ s: 'start' })} onPick={play} />
      )}
      {screen.s === 'game' && (
        <Game
          key={screen.n}
          mode={screen.mode}
          settings={settings}
          onStar={() => addStar(who === 'both' ? 'both' : screen.mode)}
          onHome={() => go({ s: 'start' })}
          onDone={(stars) => go({ s: 'finish', stars })}
        />
      )}
      {screen.s === 'finish' && (
        <Finish stars={screen.stars} today={today} onHome={onExit} onStickers={() => go({ s: 'stickers' })} />
      )}
      {screen.s === 'stickers' && <Stickers onBack={() => go({ s: 'start' })} />}
      {panel === 'gate' && <ParentGate onPass={() => setPanel('settings')} onClose={() => setPanel('none')} />}
      {panel === 'settings' && <SettingsPanel names={names} onClose={() => setPanel('none')} />}
    </div>
  )
}

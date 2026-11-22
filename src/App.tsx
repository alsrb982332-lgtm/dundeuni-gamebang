import { useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { Start } from './app/Start'
import { Who } from './app/Who'
import { Main } from './app/Main'
import { StickerBoard } from './app/StickerBoard'
import { Play } from './app/Play'
import { Sleepy } from './app/Sleepy'
import { ParentHome } from './parent/ParentHome'
import { isParentOpen } from './parent/access'
import { BackGuard } from './kids-mode/BackGuard'
import { PlayClock } from './kids-mode/PlayClock'
import { UpdateWatcher } from './kids-mode/UpdateWatcher'
import { useSettings } from './shared/settings'
import { profileStore, whoName } from './shared/useProfile'
import { nameOf } from './shared/settings'
import { setVoiceVars, setVoiceVolume } from './shared/useVoice'
import { setSfxVolume } from './shared/sfx'

/* 화면 이동 (해시 주소: GitHub Pages 에서 새로고침해도 깨지지 않음)
   /            시작 화면
   /who         누가 놀까?
   /main        게임방 메인
   /stickers    우리 스티커판
   /play/:id    게임 (src/games/registry.ts)
   /sleep       놀이 시간 끝
   /parent      부모 설정 (어른 확인 후) */

function ParentOnly({ children }: { children: ReactNode }) {
  return isParentOpen() ? <>{children}</> : <Navigate to="/main" replace />
}

/* 이름·소리 크기를 목소리 안내에 반영 */
function VoiceSync() {
  const s = useSettings()
  const { who } = profileStore.use()
  useEffect(() => {
    setVoiceVars({ 형: nameOf(s, 'hyeong'), 동생: nameOf(s, 'dong'), 이름: whoName(s, who) })
  }, [s, who])
  useEffect(() => { setVoiceVolume(s.volume); setSfxVolume(s.volume * 0.9) }, [s.volume])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <BackGuard />
      <PlayClock />
      <UpdateWatcher />
      <VoiceSync />
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/who" element={<Who />} />
        <Route path="/main" element={<Main />} />
        <Route path="/stickers" element={<StickerBoard />} />
        <Route path="/play/:id" element={<Play />} />
        <Route path="/sleep" element={<Sleepy />} />
        <Route path="/parent/*" element={<ParentOnly><ParentHome /></ParentOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}


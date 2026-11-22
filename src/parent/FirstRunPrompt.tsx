import { useState } from 'react'
import { Tap } from '../shared/Tap'
import { settingsStore, useSettings } from '../shared/settings'
import { useGo } from '../kids-mode/BackGuard'

/* 처음 설치했을 때 부모에게 한 번만: 「화면 고정을 설정할까요?」 (다시 보지 않기 가능)
   「나중에」를 누르면 다음에 앱을 켤 때 다시 물어봄 */
let laterThisRun = false

export function FirstRunPrompt() {
  const s = useSettings()
  const go = useGo()
  const [hide, setHide] = useState(laterThisRun)
  if (s.pinPromptDone || hide) return null
  return (
    <div className="overlay" role="dialog" aria-label="화면 고정 안내">
      <div className="sheet gate">
        <h2>📌 화면 고정을 설정할까요?</h2>
        <p className="note">
          (어른용 안내) 태블릿의 「앱 고정」(안드로이드) 또는 「사용법 유도」(아이패드)를 켜 두면
          아이가 게임방 밖으로 나가지 못해요. 설정 방법을 그림으로 보여 드릴게요.
        </p>
        <div className="start-row">
          <Tap className="toolbtn" onTap={() => { settingsStore.patch({ pinPromptDone: true }); go('/pin') }}>방법 보기</Tap>
          <Tap className="toolbtn" onTap={() => { laterThisRun = true; setHide(true) }}>나중에</Tap>
          <Tap className="toolbtn" onTap={() => settingsStore.patch({ pinPromptDone: true })}>다시 보지 않기</Tap>
        </div>
      </div>
    </div>
  )
}

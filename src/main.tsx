import { createRoot } from 'react-dom/client'
import './shared/styles/base.css'
import App from './App'
import { installNoZoom } from './kids-mode/noZoom'
import { registerLines } from './shared/useVoice'
import { loadRecordings } from './shared/recordings'
import { stickerStore } from './shared/useStickers'
import { rescueStore } from './parent/rescueSettings'
import APP_LINES from './app/voice.json'
import MAEUM_LINES from './games/maeum-nalssi/data/voice.json'
import HYEONGA_LINES from './games/hyeonga-rang/data/voice.json'
import BANJJAK_LINES from './games/banjjak-habits/data/voice.json'

/* 실수 조작 막기: 두 손가락 확대, 당겨서 새로고침, 길게 눌러 메뉴, 글자 선택, 그림 끌기 */
installNoZoom()

registerLines(APP_LINES)
/* 2단계로 옮긴 게임의 문장도 미리 등록 → 부모 녹음 화면에 나옴 (게임 코드는 열 때 불러옴) */
registerLines(MAEUM_LINES, '마음 날씨')
registerLines(HYEONGA_LINES, '형아랑 같이')
registerLines(BANJJAK_LINES, '반짝반짝 습관 놀이')
void loadRecordings()

/* 게임 화면(공룡나라 등) 안에서 바뀐 기록을 게임방에도 바로 반영 (같은 주소의 다른 창에서만 storage 이벤트가 옴) */
window.addEventListener('storage', (e) => {
  if (e.key === stickerStore.key) stickerStore.reload()
  if (e.key === rescueStore.key) rescueStore.reload()
})

/* 안내 음성·스티커 주기 같은 흐름이 두 번 실행되지 않도록 StrictMode 는 쓰지 않음 */
createRoot(document.getElementById('root')!).render(<App />)

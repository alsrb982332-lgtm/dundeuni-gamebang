import { createRoot } from 'react-dom/client'
import './shared/styles/base.css'
import App from './App'
import { installNoZoom } from './kids-mode/noZoom'
import { registerLines } from './shared/useVoice'
import { loadRecordings } from './shared/recordings'
import APP_LINES from './app/voice.json'

/* 실수 조작 막기: 두 손가락 확대, 당겨서 새로고침, 길게 눌러 메뉴, 글자 선택, 그림 끌기 */
installNoZoom()

registerLines(APP_LINES)
void loadRecordings()

/* 안내 음성·스티커 주기 같은 흐름이 두 번 실행되지 않도록 StrictMode 는 쓰지 않음 */
createRoot(document.getElementById('root')!).render(<App />)

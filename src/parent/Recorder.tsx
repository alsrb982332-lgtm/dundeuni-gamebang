import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Tap } from '../shared/Tap'
import { fill, say, stopVoice, voiceGroups } from '../shared/useVoice'
import { recordedKeys, saveRecording, subscribeRecordings } from '../shared/recordings'
import css from './parent.module.css'

/* 부모 목소리 녹음
   태블릿에서 직접 녹음 → 이 기기(IndexedDB)에만 저장. 서버로 보내지 않고 저장소에도 들어가지 않음
   녹음한 문장은 기계 목소리 대신 부모 목소리로 나옴 */
const MAX_MS = 12000
const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export function Recorder() {
  const recorded = useSyncExternalStore(subscribeRecordings, () => recordedKeys().join('|'))
  const has = (k: string) => recorded.split('|').includes(k)
  const [rec, setRec] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const mr = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { stop(); stopVoice() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function start(key: string) {
    setErr('')
    stopVoice()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const chunks: Blob[] = []
      const m = new MediaRecorder(stream)
      m.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      m.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRec(null)
        if (chunks.length) {
          try { await saveRecording(key, new Blob(chunks, { type: m.mimeType || 'audio/webm' })) } catch { setErr('녹음을 저장하지 못했어요.') }
        }
      }
      mr.current = m
      m.start()
      setRec(key)
      timer.current = setTimeout(stop, MAX_MS)
    } catch {
      setErr('마이크를 쓸 수 없어요. 브라우저에서 마이크 허용을 눌러 주세요.')
    }
  }
  function stop() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (mr.current && mr.current.state !== 'inactive') mr.current.stop()
    mr.current = null
  }

  if (!canRecord()) return <p className="note">이 기기(브라우저)는 녹음을 지원하지 않아요. 기계 목소리로 읽어 줘요.</p>

  return (
    <div className={css.recList}>
      <p className="note">녹음은 이 태블릿에만 저장돼요 (인터넷에 올라가지 않아요). 한 문장에 12초까지. 녹음한 문장은 🎙️ 표시가 생기고 부모님 목소리로 나와요.</p>
      {err && <p className={css.err}>{err}</p>}
      {voiceGroups().map(([group, lines]) => (
        <details key={group} className={css.recGroup}>
          <summary>{group} <small>({lines.filter(([k]) => has(k)).length}/{lines.length})</small></summary>
          {lines.map(([k, text]) => (
            <div key={k} className={css.recRow}>
              <span className={css.recText}>{has(k) ? '🎙️ ' : ''}{fill(text)}</span>
              {rec === k ? (
                <Tap className={"toolbtn " + css.recOn} onTap={stop}>⏹ 그만</Tap>
              ) : (
                <Tap className="toolbtn" disabled={!!rec} onTap={() => start(k)}>🔴 녹음</Tap>
              )}
              <Tap className="toolbtn" disabled={!!rec} onTap={() => void say(k)}>🔈</Tap>
              {has(k) && <Tap className="toolbtn" disabled={!!rec} onTap={() => void saveRecording(k, null)}>지우기</Tap>}
            </div>
          ))}
        </details>
      ))}
    </div>
  )
}

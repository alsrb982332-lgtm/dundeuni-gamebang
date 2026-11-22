import { useRef, useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { Tap } from '../shared/Tap'
import { Friend, PALETTE } from '../shared/art/Art'
import type { Kind } from '../shared/art/svg'
import { DEFAULT_NAMES, settingsStore, useSettings, type ColorKey, type Role } from '../shared/settings'
import { stickerStore } from '../shared/useStickers'
import { profileStore } from '../shared/useProfile'
import { hasKoreanVoice, sayText } from '../shared/useVoice'
import { sfx, unlockAudio } from '../shared/sfx'
import { GAMES } from '../games/registry'
import { useGo } from '../kids-mode/BackGuard'
import { lockParent } from './access'
import { playTimeStore } from './playtime'
import { applyBackup, downloadBackup, parseBackup } from './backup'
import { Recorder } from './Recorder'
import { PinGuide } from './PinGuide'
import css from './parent.module.css'

/* 부모 설정 (어른 확인을 통과해야 들어옴)
   /parent       설정
   /parent/pin   화면 고정 설정 방법 */
export function ParentHome() {
  return (
    <Routes>
      <Route path="pin" element={<PinGuide />} />
      <Route path="*" element={<Settings />} />
    </Routes>
  )
}

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => <Tap key={String(v)} aria-pressed={v === value} onTap={() => onChange(v)}>{label}</Tap>)}
    </div>
  )
}

const Row = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="row"><h3>{title}</h3>{children}</section>
)

const KINDS: Kind[] = ['bear', 'bunny', 'chick', 'cat', 'puppy']
const COLORS: ColorKey[] = ['sky', 'lime', 'pink', 'yellow', 'purple', 'orange']
const ROLE_LABEL: Record<Role, string> = { hyeong: '형', dong: '동생' }

function Settings() {
  const go = useGo()
  const s = useSettings()
  const pt = playTimeStore.use()
  const set = settingsStore.patch
  const [soundNote, setSoundNote] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [armed, setArmed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const vol = s.volume === 0 ? 0 : s.volume <= 0.45 ? 0.4 : s.volume <= 0.75 ? 0.7 : 1
  const close = () => { lockParent(); go('/main') }

  const importFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const b = parseBackup(await f.text())
      if (!confirm(`${b.exportedAt.slice(0, 10)}에 내보낸 기록으로 바꿀까요? 지금 기록은 파일 내용으로 바뀌어요.`)) return
      const n = applyBackup(b)
      settingsStore.reload(); stickerStore.reload(); profileStore.reload(); playTimeStore.reload()
      setMsg({ ok: true, text: `기록 ${n}개를 가져왔어요.` })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={css.page} role="dialog" aria-modal="true" aria-label="어른 설정">
      <div className={css.sheet}>
        <div className={css.head}>
          <h2>⚙️ 어른 설정</h2>
          <Tap className="icon small" aria-label="닫기" onTap={close}>✕</Tap>
        </div>
        <div className={css.body} data-scroll>
          <Row title="아이 이름">
            <div className="name-row">
              {(['hyeong', 'dong'] as Role[]).map((r) => (
                <label key={r}>{ROLE_LABEL[r]} <input className="text-in" value={s.names[r]} placeholder={DEFAULT_NAMES[r]} maxLength={8}
                  onChange={(e) => set({ names: { ...s.names, [r]: e.target.value } })} /></label>
              ))}
            </div>
            <p className="note">부르는 이름 그대로 써 주세요. 이름은 <b>이 태블릿에만</b> 저장되고 인터넷에 올라가지 않아요. 비워 두면 「형」「동생」으로 불러요. 목소리 안내와 모든 게임에 같은 이름이 쓰여요.</p>
          </Row>

          <Row title="아바타 (동물 · 색)">
            {(['hyeong', 'dong'] as Role[]).map((r) => {
              const a = s.avatars[r]
              const put = (p: Partial<typeof a>) => set({ avatars: { ...s.avatars, [r]: { ...a, ...p } } })
              return (
                <div key={r} className={css.roleBox}>
                  <Friend kind={a.kind} color={PALETTE[a.color]} mood="happy" className={css.roleAvatar} />
                  <div className={css.roleCol}>
                    <b>{s.names[r].trim() || DEFAULT_NAMES[r]}</b>
                    <div className={css.pickRow}>
                      {KINDS.map((k) => <Tap key={k} className={css.pick} aria-pressed={a.kind === k} aria-label={k} onTap={() => put({ kind: k })}><Friend kind={k} color={PALETTE[a.color]} mood="happy" /></Tap>)}
                    </div>
                    <div className={css.pickRow}>
                      {COLORS.map((c) => <Tap key={c} className={css.swatch} style={{ background: PALETTE[c].b }} aria-pressed={a.color === c} aria-label={c} onTap={() => put({ color: c })} />)}
                    </div>
                  </div>
                </div>
              )
            })}
          </Row>

          <Row title="하루 놀이 시간">
            <Seg value={s.dailyLimitMin} options={[[0, '제한 없음'], [10, '10분'], [20, '20분'], [30, '30분'], [40, '40분'], [60, '1시간']]} onChange={(v) => set({ dailyLimitMin: v })} />
            <p className="note">
              오늘 논 시간 {Math.floor(pt.sec / 60)}분{pt.extraMin ? ` (오늘 ${pt.extraMin}분 더 줌)` : ''}{pt.unlockedDay === pt.day ? ' · 오늘은 제한 없이 풀어 둠' : ''}.
              시간이 되면 「든든이가 졸려요. 오늘은 여기까지!」 화면이 나오고 게임이 잠겨요. 어른 확인으로만 풀 수 있어요.
            </p>
            {(pt.extraMin > 0 || pt.unlockedDay === pt.day) && (
              <Tap className="toolbtn" onTap={() => playTimeStore.patch({ extraMin: 0, unlockedDay: null })}>오늘 더 준 시간 되돌리기</Tap>
            )}
          </Row>

          <Row title="쉬는 시간 알림">
            <Seg value={s.restReminder ? 1 : 0} options={[[1, '켜기'], [0, '끄기']]} onChange={(v) => set({ restReminder: v === 1 })} />
            <p className="note">쉬지 않고 10분 놀면 「눈을 감고 쉬어 볼까?」 30초 쉬기 화면이 나와요.</p>
          </Row>

          <Row title="소리 크기">
            <Seg value={vol} options={[[0, '🔇 끄기'], [0.4, '작게'], [0.7, '보통'], [1, '크게']]} onChange={(v) => set({ volume: v })} />
            <Tap className="toolbtn" onTap={() => {
              unlockAudio(); sfx.ding(); void sayText('든든이 게임방! 소리가 잘 들려요.')
              setSoundNote(hasKoreanVoice()
                ? '한국어 목소리를 찾았어요. 그래도 안 들리면 기기 소리 크기와 무음 모드를 확인해 주세요.'
                : '한국어 읽어주기 목소리를 찾지 못했어요. 기기 설정 → 일반 → 텍스트 음성 변환(TTS)에서 한국어를 내려받아 주세요.')
            }}>🔈 소리 점검하기</Tap>
            {soundNote && <p className="note">{soundNote}</p>}
            <p className="note">아직 1단계(그대로 넣기)인 게임은 게임마다 따로 소리 설정이 있을 수 있어요.</p>
          </Row>

          <Row title="게임 켜고 끄기">
            <div className="toggles">
              {GAMES.map((g) => {
                const on = !s.gamesOff.includes(g.id)
                return (
                  <Tap key={g.id} className="toggle" aria-pressed={on}
                    onTap={() => set({ gamesOff: on ? [...s.gamesOff, g.id] : s.gamesOff.filter((x) => x !== g.id) })}>
                    <span className="box">{on ? '✔' : ''}</span><span>{g.name}</span>
                  </Tap>
                )
              })}
            </div>
            <p className="note">끈 게임은 메인 화면에 나오지 않아요.</p>
          </Row>

          <Row title="엄마·아빠 목소리 녹음">
            <Recorder />
          </Row>

          <Row title="기록 백업 (태블릿을 바꿀 때)">
            <div className="start-row" style={{ justifyContent: 'flex-start' }}>
              <Tap className="toolbtn" onTap={() => { const n = downloadBackup(); setMsg({ ok: true, text: `기록 ${n}개를 파일로 내보냈어요. (다운로드 폴더)` }) }}>📤 기록 내보내기</Tap>
              <Tap className="toolbtn" onTap={() => fileRef.current?.click()}>📥 기록 가져오기</Tap>
              <input ref={fileRef} className={css.file} type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} />
            </div>
            {msg && <p className={msg.ok ? css.msg : css.err}>{msg.text}</p>}
            <p className="note">스티커·설정·게임 기록을 JSON 파일 하나로 저장해요. 새 태블릿에서 「기록 가져오기」로 그 파일을 고르면 이어서 할 수 있어요. (녹음은 들어가지 않아요)</p>
            <Tap className="danger" onTap={() => {
              if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return }
              setArmed(false); stickerStore.set({ version: 1, list: [] }); setMsg({ ok: true, text: '게임방 스티커를 지웠어요.' })
            }}>{armed ? '한 번 더 누르면 지워져요' : '게임방 스티커 모두 지우기'}</Tap>
          </Row>

          <Row title="태블릿 화면 고정">
            <p className="note">아이가 게임방 밖으로 나가지 못하게 태블릿의 「앱 고정」(안드로이드) 또는 「사용법 유도」(아이패드)를 켜 두면 좋아요.</p>
            <Tap className="toolbtn" onTap={() => go('/parent/pin')}>📌 화면 고정 설정 방법 보기</Tap>
          </Row>

          <p className={css.version}>든든이 게임방 v{__APP_VERSION__} · {__BUILD_DATE__}</p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Tap } from '../../../shared/Tap'
import { GAMES } from './Select'
import type { GameId, Progress, Settings } from '../progress'

function Seg<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => <Tap key={String(v)} aria-pressed={v === value} onTap={() => onChange(v)}>{label}</Tap>)}
    </div>
  )
}

type Own = Pick<Settings, 'hyeongSide' | 'maxGames' | 'maxMinutes' | 'off' | 'debug'>
type Props = { settings: Settings; setSettings: (p: Partial<Own>) => void; progress: Progress; onReset: () => void; onClose: () => void }

/* 형아랑 같이 어른 설정 (어른 확인 후). 이름·아바타·소리 크기·녹음은 게임방 어른 설정에서 */
export function SettingsPanel({ settings: s, setSettings, progress, onReset, onClose }: Props) {
  const [armed, setArmed] = useState(false)
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="형아랑 같이 어른 설정">
      <div className="sheet" data-scroll>
        <div className="sheet-head">
          <h2>⚙️ 형아랑 같이 설정</h2>
          <Tap className="icon small" aria-label="닫기" onTap={onClose}>✕</Tap>
        </div>
        <p className="note">아이 이름·아바타·소리 크기·목소리 녹음은 게임방 메인의 ⚙️ 어른 설정에서 바꿔요.</p>

        <div className="row">
          <h3>자리</h3>
          <Seg value={s.hyeongSide} options={[['left', `${s.hyeong} 위(왼쪽)`], ['right', `${s.hyeong} 아래(오른쪽)`]]} onChange={(v) => setSettings({ hyeongSide: v })} />
          <p className="note">세로 화면에서는 위·아래, 가로 화면에서는 왼쪽·오른쪽으로 나눠요. 한 사람씩 번갈아 누르면 돼요.</p>
        </div>

        <div className="row">
          <h3>한 번에 놀기</h3>
          <Seg value={s.maxGames} options={[[0, '제한 없음'], [2, '2판'], [3, '3판'], [5, '5판']]} onChange={(v) => setSettings({ maxGames: v })} />
          <Seg value={s.maxMinutes} options={[[0, '제한 없음'], [5, '5분'], [10, '10분'], [15, '15분']]} onChange={(v) => setSettings({ maxMinutes: v })} />
        </div>

        <div className="row">
          <h3>미니게임 켜고 끄기</h3>
          <div className="toggles">
            {GAMES.map((g) => {
              const on = !s.off.includes(g.id)
              return (
                <Tap key={g.id} className="toggle" aria-pressed={on}
                  onTap={() => setSettings({ off: on ? [...s.off, g.id] : s.off.filter((x: GameId) => x !== g.id) })}>
                  <span className="box">{on ? '✔' : ''}</span><span>{g.pic} {g.name}</span>
                </Tap>
              )
            })}
          </div>
        </div>

        <div className="row">
          <h3>디버그 모드 (PC 시험용)</h3>
          <Seg value={s.debug} options={[[false, '끄기'], [true, '켜기']]} onChange={(v) => setSettings({ debug: v })} />
          <p className="note">켜면 누른 곳이 표시되고, 키보드 A = 형, L = 동생으로 누를 수 있어요.</p>
        </div>

        <div className="row">
          <h3>기록</h3>
          <p className="note">우리 별 {progress.total}개 · 놀이한 날 {Object.keys(progress.days).length}일</p>
          <Tap className="danger" onTap={() => {
            if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return }
            setArmed(false); onReset()
          }}>{armed ? '한 번 더 누르면 지워져요' : '우리 별 모두 지우기'}</Tap>
        </div>
      </div>
    </div>
  )
}

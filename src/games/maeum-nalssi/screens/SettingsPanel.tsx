import { cx } from '../cx'
import { useState } from 'react'
import { EMOTIONS } from '../data/emotions'
import { ALL_SITUATIONS } from '../rounds'
import { Tap } from '../../../shared/Tap'
import { fill } from '../../../shared/useVoice'
import { stickerStore } from '../../../shared/useStickers'
import { maeumStore, useMaeumSettings, GAME_ID } from '../progress'

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className={cx('seg')}>
      {options.map(([v, label]) => <Tap key={String(v)} aria-pressed={v === value} onTap={() => onChange(v)}>{label}</Tap>)}
    </div>
  )
}

/* 마음 날씨 어른 설정 (어른 확인 후). 아이 이름·소리 크기·녹음은 게임방 어른 설정에서 */
export function SettingsPanel({ names, onClose }: { names: { hyeong: string; dong: string }; onClose: () => void }) {
  const s = useMaeumSettings()
  const set = maeumStore.patch
  const stars = stickerStore.use().list.filter((x) => x.game === GAME_ID)
  const [armed, setArmed] = useState(false)

  return (
    <div className={cx('overlay')} role="dialog" aria-modal="true" aria-label="마음 날씨 어른 설정">
      <div className={cx('sheet')} data-scroll>
        <div className={cx('sheet-head')}>
          <h2>⚙️ 마음 날씨 설정</h2>
          <Tap className={cx('icon small')} aria-label="닫기" onTap={onClose}>✕</Tap>
        </div>
        <p className={cx('note')}>아이 이름·소리 크기·엄마 아빠 목소리 녹음은 게임방 메인의 ⚙️ 어른 설정에서 바꿔요.</p>

        <div className={cx('row')}>
          <h3>한 판 문제 수</h3>
          <div className={cx('name-row')}>{names.dong}<Seg value={s.dongCount} options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]} onChange={(v) => set({ dongCount: v })} /></div>
          <div className={cx('name-row')}>{names.hyeong}<Seg value={s.hyeongCount} options={[[3, '3'], [4, '4'], [5, '5'], [6, '6']]} onChange={(v) => set({ hyeongCount: v })} /></div>
          <div className={cx('name-row')}>{names.hyeong} 기분 카드 수<Seg value={s.hyeongChoices} options={[[3, '3개'], [4, '4개']]} onChange={(v) => set({ hyeongChoices: v })} /></div>
          <p className={cx('note')}>기본은 동생 3문제(보기 2개), 형 5문제(보기 4개 + 행동 고르기)예요.</p>
        </div>

        <div className={cx('row')}>
          <h3>상황 켜고 끄기</h3>
          <div className={cx('toggles')}>
            {ALL_SITUATIONS.map((x) => {
              const on = !s.off.includes(x.id)
              return (
                <Tap key={x.id} className={cx('toggle')} aria-pressed={on}
                  onTap={() => set({ off: on ? [...s.off, x.id] : s.off.filter((i) => i !== x.id) })}>
                  <span className={cx('box')}>{on ? '✔' : ''}</span>
                  <span>
                    {x.id}. {fill(x.story)} <small>({EMOTIONS[x.emotion]?.name ?? x.emotion}{x.modes.includes('dong') ? ' · 둘 다' : ` · ${names.hyeong}`})</small>
                  </span>
                </Tap>
              )
            })}
          </div>
          <p className={cx('note')}>상황은 src/games/maeum-nalssi/data/situations.json 에 있어요. 추가하는 방법은 README 를 보세요.</p>
        </div>

        <div className={cx('row')}>
          <h3>기록</h3>
          <p className={cx('note')}>마음 날씨에서 모은 별 {stars.length}개 · 놀이한 날 {new Set(stars.map((x) => x.day)).size}일</p>
          <Tap className={cx('danger')} onTap={() => {
            if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return }
            setArmed(false)
            stickerStore.set((b) => ({ ...b, list: b.list.filter((x) => x.game !== GAME_ID) }))
          }}>{armed ? '한 번 더 누르면 지워져요' : '마음 날씨 별 모두 지우기'}</Tap>
        </div>
      </div>
    </div>
  )
}

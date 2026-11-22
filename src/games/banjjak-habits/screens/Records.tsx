import { cx } from '../cx'
import { useEffect, useState } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun } from '../../../shared/art/Art'
import { HabitSticker } from '../components/Habit'
import { HABITS, THEMES } from '../data/habits'
import { isOn, type DayRec, type Records as Rec, type Settings } from '../progress'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'

const iconOf = (id: string) => HABITS.find((h) => h.id === id)?.icon || '⭐'

/* ---------- 오늘은 여기까지! (다음 습관이 저절로 시작되지 않음) ---------- */
export function Finish({ today, onHome, onMore, onBoard }: { today: DayRec; onHome: () => void; onMore: () => void; onBoard: () => void }) {
  useEffect(() => { sfx.fanfare(); say('done_today') }, [])
  return (
    <main className={cx('screen')}>
      <div className={cx('finish-card')}>
        <Dundun mood="happy" wave className={cx('fd')} />
        <h2>참 잘했어요!</h2>
        <div className={cx('sticker-row')}>
          {today.play.map((h, i) => <HabitSticker key={'p' + i} icon={iconOf(h)} />)}
        </div>
        <p className={cx('sub')}>오늘 모은 습관 스티커 {today.play.length}개</p>
        <div className={cx('start-row')}>
          <Tap className={cx('big-btn')} onTap={onMore}>✨ 다른 습관</Tap>
          <Tap className={cx('big-btn soft')} onTap={onBoard}>⭐ 스티커판</Tap>
          <Tap className={cx('big-btn soft')} onTap={onHome}>🏠 게임방으로</Tap>
        </div>
      </div>
    </main>
  )
}

/* ---------- 스티커판 (날짜별) ---------- */
export function Board({ records, totals, onBack }: { records: Rec; totals: { play: number; real: number }; onBack: () => void }) {
  useEffect(() => { say('board') }, [])
  const days = Object.entries(records).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}><Tap className={cx('icon')} aria-label="뒤로" onTap={onBack}>◀</Tap><div className={cx('ztitle')}>⭐ 스티커판</div></div>
      </header>
      <main className={cx('screen board')} data-scroll>
        <div className={cx('totals')}>
          <div className={cx('tot')}><HabitSticker icon="⭐" /> 습관 스티커 <b>{totals.play}</b></div>
        </div>
        {!days.length && <p className={cx('sub')}>아직 스티커가 없어요. 놀이를 하면 스티커가 생겨요!</p>}
        {days.map(([d, r]) => (
          <section key={d} className={cx('day')}>
            <h3>{+d.slice(5, 7)}월 {+d.slice(8)}일</h3>
            <div className={cx('day-row')}>{r.play.map((h, i) => <HabitSticker key={i} icon={iconOf(h)} />)}</div>
          </section>
        ))}
      </main>
    </>
  )
}

/* ---------- 어른 설정 (이름·소리 크기·녹음은 게임방 어른 설정에서) ---------- */
function Seg<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className={cx('seg')}>{options.map(([v, l]) => <Tap key={String(v)} aria-pressed={v === value} onTap={() => onChange(v)}>{l}</Tap>)}</div>
}

type Own = Pick<Settings, 'todayHabit' | 'five' | 'drag' | 'on'>
export function SettingsPanel({ s, setSettings, totals, onReset, onClose }: { s: Settings; setSettings: (p: Partial<Own>) => void; totals: { play: number }; onReset: () => void; onClose: () => void }) {
  const [armed, setArmed] = useState(false)
  const enabled = HABITS.filter((h) => isOn(s, h.id))
  return (
    <div className={cx('overlay')} role="dialog" aria-modal="true" aria-label="습관 놀이 어른 설정">
      <div className={cx('sheet')} data-scroll>
        <div className={cx('sheet-head')}>
          <h2>⚙️ 습관 놀이 설정</h2>
          <Tap className={cx('icon small')} aria-label="닫기" onTap={onClose}>✕</Tap>
        </div>
        <p className={cx('note')}>아이 이름·소리 크기·목소리 녹음은 게임방 메인의 ⚙️ 어른 설정에서 바꿔요.</p>

        <div className={cx('row')}>
          <h3>오늘의 습관</h3>
          <div className={cx('seg')}>
            <Tap aria-pressed={!s.todayHabit} onTap={() => setSettings({ todayHabit: '' })}>아이가 고르기</Tap>
            {enabled.map((h) => <Tap key={h.id} aria-pressed={s.todayHabit === h.id} onTap={() => setSettings({ todayHabit: h.id })}>{h.name}</Tap>)}
          </div>
          <p className={cx('note')}>정해 두면 습관 고르기 없이 바로 그 습관으로 시작해요.</p>
        </div>

        <div className={cx('row')}>
          <h3>형 모드</h3>
          <Seg value={s.five} options={[[false, '4단계'], [true, '5단계']]} onChange={(v) => setSettings({ five: v })} />
          <div className={cx('name-row')}>카드 놓기<Seg value={s.drag} options={[[false, '누르기만'], [true, '누르기 + 끌어다 놓기']]} onChange={(v) => setSettings({ drag: v })} /></div>
        </div>

        <div className={cx('row')}>
          <h3>습관 켜고 끄기</h3>
          {THEMES.map((t) => (
            <div key={t.id}>
              <p className={cx('note')}>{t.icon} {t.name}</p>
              <div className={cx('toggles')}>
                {HABITS.filter((h) => h.theme === t.id).map((h) => {
                  const on = isOn(s, h.id)
                  return (
                    <Tap key={h.id} className={cx('toggle')} aria-pressed={on} onTap={() => {
                      const next = { ...s.on, [h.id]: !on }
                      if (HABITS.some((x) => next[x.id] !== false)) setSettings({ on: next, todayHabit: !on || s.todayHabit !== h.id ? s.todayHabit : '' })
                    }}>
                      <span className={cx('box')}>{on ? '✔' : ''}</span><span>{h.name}</span>
                    </Tap>
                  )
                })}
              </div>
            </div>
          ))}
          <p className={cx('note')}>새 습관은 src/games/banjjak-habits/data/habits.json 에 추가해요(README 참고).</p>
        </div>

        <div className={cx('row')}>
          <h3>기록</h3>
          <p className={cx('note')}>습관 스티커 {totals.play}개</p>
          <Tap className={cx('danger')} onTap={() => {
            if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return }
            setArmed(false); onReset()
          }}>{armed ? '한 번 더 누르면 지워져요' : '스티커 모두 지우기'}</Tap>
        </div>
      </div>
    </div>
  )
}

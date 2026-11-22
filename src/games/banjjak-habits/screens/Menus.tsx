import { cx } from '../cx'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun } from '../../../shared/art/Art'
import { Avatar } from '../../../shared/Avatar'
import { HabitSticker, StepIcon } from '../components/Habit'
import { HABITS, THEMES, type Habit, type ThemeId } from '../data/habits'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import { isOn, type Settings } from '../progress'
import type { Mode } from './Play'

const TITLE = '반짝반짝 습관 놀이'
const DECO = ['✨', '🪥', '🧼', '👕', '🍚', '🌙', '🧸', '⭐']

export function Start({ totals, onStart, onBoard, onSettings }: { totals: { play: number; real: number }; onStart: () => void; onBoard: () => void; onSettings: () => void }) {
  const deco = useMemo(() => Array.from({ length: 14 }, (_, k) => ({ e: DECO[k % DECO.length], l: Math.random() * 92, t: Math.random() * 90, fs: 24 + Math.random() * 26, d: 3 + Math.random() * 3, dl: Math.random() * 5, r: Math.random() * 40 - 20 })), [])
  let i = 0
  return (
    <div className={cx('start')}>
      <div className={cx('deco')} aria-hidden="true">
        {deco.map((d, k) => <span key={k} style={{ left: d.l + '%', top: d.t + '%', '--fs': d.fs + 'px', '--dur': d.d + 's', '--dl': -d.dl + 's', '--rot': d.r + 'deg' } as CSSProperties}>{d.e}</span>)}
      </div>
      <Tap className={cx('icon small start-set')} aria-label="어른 설정" onTap={onSettings}>⚙️</Tap>
      <div className={cx('maker')}>💛 든든이 교육 게임</div>
      <h1 className={cx('title')} aria-label={TITLE}>
        {[...TITLE].map((ch, k) => (ch === ' ' ? <span key={k} className={cx('sp')} /> : <span key={k} style={{ '--i': i++ } as CSSProperties}>{ch}</span>))}
      </h1>
      <Tap className={cx('hero shiny')} aria-label="든든이" onTap={() => { sfx.sparkle(); say('hello') }}>
        <Dundun mood="joy" wave />
      </Tap>
      <Tap className={cx('big-btn bounce')} onTap={onStart}>▶ 시작</Tap>
      <Tap className={cx('big-btn soft')} aria-label="스티커판" onTap={onBoard}>
        <HabitSticker icon="⭐" style={{ width: 52, height: 52 }} /> {totals.play}
        <HabitSticker icon="⭐" gold style={{ width: 52, height: 52 }} /> {totals.real}
      </Tap>
    </div>
  )
}

export function ModeSelect({ s, onPick, onHome }: { s: Settings; onPick: (m: Mode) => void; onHome: () => void }) {
  const alive = useAlive()
  useEffect(() => { say('who') }, [])
  const choose = async (m: Mode) => {
    sfx.pop()
    await say(m === 'dong' ? 'mode_dong' : 'mode_hyeong')
    if (alive()) onPick(m)
  }
  return (
    <>
      <header className={cx('top')}><div className={cx('left')}><Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap></div></header>
      <main className={cx('screen')}>
        <Tap className={cx('ask')} onTap={() => say('who')}><span>🔈</span> 누가 할까?</Tap>
        <div className={cx('modes')}>
          <Tap className={cx('mode dong')} aria-label={s.dongsaeng} onTap={() => choose('dong')}>
            <Avatar role="dong" mood="happy" />
            <span className={cx('mn')}>{s.dongsaeng.trim() || '동생'}</span>
            <span className={cx('ms')}>따라 하기 · 3단계</span>
          </Tap>
          <Tap className={cx('mode hyeong')} aria-label={s.hyeong} onTap={() => choose('hyeong')}>
            <Avatar role="hyeong" mood="happy" />
            <span className={cx('mn')}>{s.hyeong.trim() || '형'}</span>
            <span className={cx('ms')}>순서 맞히기 · {s.five ? 5 : 4}단계</span>
          </Tap>
        </div>
      </main>
    </>
  )
}

/* 습관 고르기: 아침 · 낮 · 저녁 으로 묶음 (지금 시간에 맞는 묶음이 먼저 열림) */
const nowTheme = (): ThemeId => { const h = new Date().getHours(); return h < 11 ? 'morning' : h < 17 ? 'day' : 'night' }

export function HabitSelect({ s, done, onPick, onHome }: { s: Settings; done: string[]; onPick: (h: Habit) => void; onHome: () => void }) {
  const alive = useAlive()
  const all = HABITS.filter((h) => isOn(s, h.id))
  const themes = THEMES.filter((t) => all.some((h) => h.theme === t.id))
  const [theme, setTheme] = useState<ThemeId>(() => (themes.some((t) => t.id === nowTheme()) ? nowTheme() : themes[0]?.id ?? 'morning'))
  const list = all.filter((h) => h.theme === theme)
  useEffect(() => { say('pick_habit') }, [])
  const choose = async (h: Habit) => {
    sfx.pop()
    await say(`habit_${h.id}`, { text: h.name + '!' })
    if (alive()) onPick(h)
  }
  return (
    <>
      <header className={cx('top')}><div className={cx('left')}><Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap></div></header>
      <main className={cx('screen habit-pick')}>
        <div className={cx('themes')}>
          {themes.map((t) => (
            <Tap key={t.id} className={cx('theme th-' + t.id)} aria-pressed={t.id === theme} onTap={() => { sfx.pop(); setTheme(t.id); say('theme_' + t.id) }}>
              <span className={cx('ti')}>{t.icon}</span><span className={cx('tn')}>{t.name}</span>
            </Tap>
          ))}
        </div>
        <div className={cx('habits scene-' + theme)}>
          {list.map((h) => (
            <Tap key={h.id} className={cx('hcard' + (done.includes(h.id) ? ' did' : ''))} aria-label={h.name} onTap={() => choose(h)}>
              <StepIcon icon={h.icon} />
              <span className={cx('hn')}>{h.name}</span>
              {done.includes(h.id) && <span className={cx('did-mark')}>✔</span>}
            </Tap>
          ))}
        </div>
      </main>
    </>
  )
}

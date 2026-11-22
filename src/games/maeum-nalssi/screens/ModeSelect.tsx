import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { Avatar } from '../../../shared/Avatar'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import type { Mode } from './Game'

export function ModeSelect({ dong, hyeong, onPick, onHome }: { dong: string; hyeong: string; onPick: (m: Mode) => void; onHome: () => void }) {
  const alive = useAlive()
  useEffect(() => { say('who') }, [])
  const pickMode = async (m: Mode) => {
    sfx.pop()
    await say(m === 'dong' ? 'mode_dong' : 'mode_hyeong')
    if (alive()) onPick(m)
  }
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}><Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap></div>
      </header>
      <main className={cx('screen')}>
        <Tap className={cx('ask')} onTap={() => say('who')}><span className={cx('spk')}>🔈</span> 누가 할까?</Tap>
        <div className={cx('modes')}>
          <Tap className={cx('mode dong')} aria-label={dong} onTap={() => pickMode('dong')}>
            <Avatar role="dong" mood="happy" />
            <span className={cx('mn')}>{dong}</span>
            <span className={cx('ms')}>☀️ 🌧️</span>
          </Tap>
          <Tap className={cx('mode hyeong')} aria-label={hyeong} onTap={() => pickMode('hyeong')}>
            <Avatar role="hyeong" mood="happy" />
            <span className={cx('mn')}>{hyeong}</span>
            <span className={cx('ms')}>☀️ 🌧️ ⛈️ 🌫️ 🌈 ☁️</span>
          </Tap>
        </div>
      </main>
    </>
  )
}

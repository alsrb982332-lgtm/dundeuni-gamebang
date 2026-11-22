import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { StarSticker } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import type { Progress } from '../progress'

/* 우리 별 스티커판 — 둘이 함께 모은 별 (개인 점수·비교 없음) */
export function Board({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  useEffect(() => { say('board') }, [])
  const days = Object.entries(progress.days).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}>
          <Tap className={cx('icon')} aria-label="뒤로" onTap={onBack}>◀</Tap>
          <div className={cx('ztitle')}>⭐ 우리 별</div>
        </div>
        <div className={cx('right')}><div className={cx('stars')}><StarSticker /> {progress.total}</div></div>
      </header>
      <main className={cx('screen board')} data-scroll>
        {!days.length && <p className={cx('sub')}>아직 우리 별이 없어요. 같이 놀면 별이 생겨요!</p>}
        {days.map(([d, n]) => (
          <section key={d} className={cx('day')}>
            <h3>{d.slice(5).replace('-', '월 ') + '일'}</h3>
            <div className={cx('star-grid')}>
              {Array.from({ length: Math.min(n, 60) }, (_, i) => <StarSticker key={i} />)}
              {n > 60 && <span className={cx('more')}>+{n - 60}</span>}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}

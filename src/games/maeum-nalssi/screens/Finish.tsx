import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun, StarSticker } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'

/* 오늘은 여기까지! — 다음 판이 저절로 시작되지 않음 */
export function Finish({ stars, today, onHome, onStickers }: { stars: number; today: number; onHome: () => void; onStickers: () => void }) {
  useEffect(() => {
    sfx.fanfare()
    say('done', { vars: { count: String(stars) } })
  }, [stars])
  return (
    <main className={cx('screen finish')}>
      <div className={cx('finish-card')}>
        <Dundun mood="happy" wave className={cx('fd')} />
        <h2>오늘은 여기까지!</h2>
        <div className={cx('star-row')}>
          {Array.from({ length: stars }, (_, i) => <StarSticker key={i} style={{ animationDelay: i * 0.25 + 's' }} />)}
        </div>
        <p className={cx('sub')}>오늘 모은 별 {today}개 · 내일 또 만나!</p>
        <div className={cx('start-row')}>
          <Tap className={cx('big-btn')} onTap={onHome}>🏠 게임방으로</Tap>
          <Tap className={cx('big-btn soft')} aria-label="스티커 모음판" onTap={onStickers}><StarSticker style={{ width: 44, height: 44 }} /> 모음판</Tap>
        </div>
      </div>
    </main>
  )
}

import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun, StarSticker } from '../../../shared/art/Art'
import { Avatar, type PlayCtx } from '../components/SplitScreen'
import { say } from '../../../shared/useVoice'
import { sfx } from '../../../shared/sfx'

/* 오늘은 여기까지! (오늘 모은 우리 별) — 다음 놀이가 저절로 시작되지 않음 */
export function Finish({ ctx, stars, onHome, onBoard }: { ctx: PlayCtx; stars: number; onHome: () => void; onBoard: () => void }) {
  useEffect(() => {
    sfx.fanfare()
    say('done', { vars: { count: String(stars) } })
  }, [stars])
  return (
    <main className={cx('screen')}>
      <div className={cx('finish-card')}>
        <div className={cx('yay-pics small')}>
          <Avatar role="hyeong" ctx={ctx} wave />
          <Dundun mood="happy" wave className={cx('yay-dun')} />
          <Avatar role="dong" ctx={ctx} wave />
        </div>
        <h2>오늘은 여기까지!</h2>
        <div className={cx('star-row')}>
          {Array.from({ length: stars }, (_, i) => <StarSticker key={i} style={{ animationDelay: i * 0.25 + 's' }} />)}
        </div>
        <p className={cx('sub')}>우리 별 {stars}개 · 내일 또 같이 놀자!</p>
        <div className={cx('start-row')}>
          <Tap className={cx('big-btn')} onTap={onHome}>🏠 게임방으로</Tap>
          <Tap className={cx('big-btn soft')} onTap={onBoard}><StarSticker style={{ width: 44, height: 44 }} /> 우리 별</Tap>
        </div>
      </div>
    </main>
  )
}

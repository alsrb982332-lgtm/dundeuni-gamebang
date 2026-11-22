import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { StarSticker } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { byDay, stickerStore } from '../../../shared/useStickers'
import { GAME_ID } from '../progress'

/* 마음 날씨에서 모은 별 (게임방 공통 스티커판에서 이 게임 것만) */
export function Stickers({ onBack }: { onBack: () => void }) {
  useEffect(() => { say('stickers') }, [])
  const mine = stickerStore.use().list.filter((s) => s.game === GAME_ID)
  const days = byDay(mine)
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}>
          <Tap className={cx('icon')} aria-label="뒤로" onTap={onBack}>◀</Tap>
          <div className={cx('ztitle')}>⭐ 스티커 모음판</div>
        </div>
        <div className={cx('right')}><div className={cx('stars')}><StarSticker /> {mine.length}</div></div>
      </header>
      <main className={cx('screen board')} data-scroll>
        {!days.length && <p className={cx('sub')}>아직 별이 없어요. 놀이를 하면 별 스티커가 생겨요!</p>}
        {days.map(([d, list]) => (
          <section key={d} className={cx('day')}>
            <h3>{+d.slice(5, 7)}월 {+d.slice(8)}일</h3>
            <div className={cx('star-grid')}>
              {list.slice(0, 60).map((_, i) => <StarSticker key={i} />)}
              {list.length > 60 && <span className={cx('more')}>+{list.length - 60}</span>}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}

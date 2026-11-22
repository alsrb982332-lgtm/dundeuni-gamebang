import { cx } from '../cx'
import { useEffect } from 'react'
import { Tap } from '../../../shared/Tap'
import { Dundun, Friend, PALETTE } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import type { Role, Settings } from '../progress'

/* 플레이어 확인: 둘이 같이 / 혼자(반대쪽은 든든이나 부모님) */
export function Players({ s, onPick, onHome }: { s: Settings; onPick: (bot: Role | null) => void; onHome: () => void }) {
  const alive = useAlive()
  useEffect(() => { say('players') }, [])
  const hy = s.hyeong.trim() || '형'
  const dn = s.dongsaeng.trim() || '동생'
  const choose = async (bot: Role | null) => {
    sfx.pop()
    await say(bot ? 'players_solo' : 'players_both')
    if (alive()) onPick(bot)
  }
  const bear = <Friend kind={s.hyeongKind} color={PALETTE[s.hyeongColor]} mood="happy" />
  const bunny = <Friend kind={s.dongKind} color={PALETTE[s.dongColor]} mood="happy" />
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}><Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap></div>
      </header>
      <main className={cx('screen')}>
        <Tap className={cx('ask')} onTap={() => say('players')}><span>🔈</span> 누가 할까?</Tap>
        <div className={cx('players')}>
          <Tap className={cx('pcard both')} onTap={() => choose(null)}>
            <span className={cx('pics')}>{bear}{bunny}</span>
            <span className={cx('pn')}>둘이 같이</span>
          </Tap>
          <Tap className={cx('pcard')} onTap={() => choose('dong')}>
            <span className={cx('pics')}>{bear}<Dundun mood="happy" /></span>
            <span className={cx('pn')}>{hy} 혼자</span>
          </Tap>
          <Tap className={cx('pcard')} onTap={() => choose('hyeong')}>
            <span className={cx('pics')}><Dundun mood="happy" />{bunny}</span>
            <span className={cx('pn')}>{dn} 혼자</span>
          </Tap>
        </div>
        <p className={cx('sub')}>혼자일 때는 반대쪽을 든든이가 도와줘요. 엄마·아빠가 눌러 줘도 돼요.</p>
      </main>
    </>
  )
}

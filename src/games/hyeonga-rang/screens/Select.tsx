import { cx } from '../cx'
import { useEffect, type CSSProperties } from 'react'
import { Tap } from '../../../shared/Tap'
import { StarSticker } from '../../../shared/art/Art'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import type { GameId, Settings } from '../progress'

export const GAMES: { id: GameId; name: string; pic: string; kc: string }[] = [
  { id: 'bridge', name: '동시에 꾹!', pic: '🌉', kc: '#5C9FDA' },
  { id: 'tower', name: '차례차례 탑', pic: '🧱', kc: '#E58F3E' },
  { id: 'coloring', name: '같이 색칠', pic: '🎨', kc: '#DE7BA8' },
  { id: 'moving', name: '짐 나르기', pic: '📦', kc: '#97BE48' },
]

type Props = { s: Settings; played: number; stars: number; onPick: (g: GameId) => void; onHome: () => void; onEnd: () => void }

export function Select({ s, played, stars, onPick, onHome, onEnd }: Props) {
  const alive = useAlive()
  const list = GAMES.filter((g) => !s.off.includes(g.id))
  useEffect(() => { say(played ? 'more' : 'pick_game') }, [played])
  const pickGame = async (g: GameId) => {
    sfx.pop()
    await say('g_' + g)
    if (alive()) onPick(g)
  }
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}><Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap></div>
        <div className={cx('right')}>
          {played > 0 && <Tap className={cx('icon')} aria-label="오늘은 그만" onTap={onEnd}>🌙</Tap>}
          <div className={cx('stars')}><StarSticker /> {stars}</div>
        </div>
      </header>
      <main className={cx('screen')}>
        <Tap className={cx('ask')} onTap={() => say('pick_game')}><span>🔈</span> 어떤 놀이를 할까?</Tap>
        <div className={cx('games')}>
          {list.map((g) => (
            <Tap key={g.id} className={cx('gcard g-' + g.id)} style={{ '--kc': g.kc } as CSSProperties} onTap={() => pickGame(g.id)}>
              <span className={cx('gp')}>{g.pic}</span>
              <span className={cx('gn')}>{g.name}</span>
            </Tap>
          ))}
        </div>
      </main>
    </>
  )
}

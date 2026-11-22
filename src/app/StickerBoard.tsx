import { useEffect, type CSSProperties } from 'react'
import { GAMES } from '../games/registry'
import { GameArt, Glyph, StarSticker } from '../shared/art/Art'
import { Tap } from '../shared/Tap'
import { byDay, countFor, readLegacyStars, stickerStore } from '../shared/useStickers'
import { say } from '../shared/useVoice'
import { useGo } from '../kids-mode/BackGuard'
import css from './app.module.css'

/* 우리 스티커판: 모든 게임의 스티커를 한곳에 */
export function StickerBoard() {
  const go = useGo()
  const { list } = stickerStore.use()
  useEffect(() => { const t = setTimeout(() => void say('stickers'), 300); return () => clearTimeout(t) }, [])
  const days = byDay(list)
  const perGame = GAMES.map((g) => ({ g, n: countFor(list, g.id) + (g.kind === 'legacy' ? readLegacyStars(g.id) : 0), gold: countFor(list, g.id, 'gold') }))
  const total = perGame.reduce((a, x) => a + x.n, 0)
  const nameOf = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id

  return (
    <div className={css.mainWrap}>
      <header className="top">
        <div className="left">
          <Tap className="icon" aria-label="게임방으로" onTap={() => go('/main')}>◀</Tap>
          <div className="ztitle">⭐ 우리 스티커판</div>
        </div>
        <div className="right"><div className="stars"><StarSticker /> {total}</div></div>
      </header>
      <main className={css.board} data-scroll>
        <section className={css.gameSums}>
          {perGame.map(({ g, n, gold }) => (
            <div key={g.id} className={css.gameSum} style={{ '--kc': g.color } as CSSProperties}>
              <GameArt id={g.art || g.id} className={css.sumArt} />
              <span className={css.sumN}><StarSticker /> {n}{gold > 0 && <> · <StarSticker gold /> {gold}</>}</span>
            </div>
          ))}
        </section>
        {!days.length && <p className="sub">게임을 하면 여기에 스티커가 모여요!</p>}
        {days.map(([d, items]) => (
          <section key={d} className={css.day}>
            <h3>{+d.slice(5, 7)}월 {+d.slice(8)}일</h3>
            <div className={css.starGrid}>
              {items.slice(0, 80).map((st, i) => (
                <span key={i} className={css.sticker} title={nameOf(st.game)}>
                  <StarSticker gold={st.kind === 'gold'} />
                  {st.icon && <Glyph icon={st.icon} className={css.stickerIcon} />}
                </span>
              ))}
              {items.length > 80 && <span className={css.more}>+{items.length - 80}</span>}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

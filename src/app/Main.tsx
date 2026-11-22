import { useEffect, useState, type CSSProperties } from 'react'
import { GAMES } from '../games/registry'
import { Card } from '../shared/BigButton'
import { GameArt, StarSticker } from '../shared/art/Art'
import { Avatar } from '../shared/Avatar'
import { Dundeuni } from '../shared/Dundeuni'
import { Tap } from '../shared/Tap'
import { useProfile } from '../shared/useProfile'
import { useSettings } from '../shared/settings'
import { stickerStore, readLegacyStars } from '../shared/useStickers'
import { say } from '../shared/useVoice'
import { sfx } from '../shared/sfx'
import { useAlive } from '../shared/useAlive'
import { useGo } from '../kids-mode/BackGuard'
import { isOver, playTimeStore } from '../parent/playtime'
import { ParentGate } from '../parent/ParentGate'
import { unlockParent } from '../parent/access'
import css from './app.module.css'

/* 게임방 메인: 게임 그림 카드 6개 (가로 3×2, 세로 2×3) */
export function Main() {
  const go = useGo()
  const alive = useAlive()
  const s = useSettings()
  const { who } = useProfile()
  const pt = playTimeStore.use()
  const book = stickerStore.use()
  const [gate, setGate] = useState(false)
  const [busy, setBusy] = useState('')
  const over = isOver(pt, s.dailyLimitMin)
  const list = GAMES.filter((g) => !s.gamesOff.includes(g.id))
  const total = book.list.length + GAMES.reduce((a, g) => a + (g.kind === 'legacy' ? readLegacyStars(g.id) : 0), 0)

  useEffect(() => {
    const t = setTimeout(async () => {
      if (over) return void say('sleepy')
      await say('main')
      if (alive() && who === 'both' && list.some((g) => g.together)) await say('main_both')
    }, 400)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (id: string) => {
    if (busy) return
    sfx.pop()
    if (over) return go('/sleep')
    setBusy(id)
    await say('game_' + id)
    if (alive()) go('/play/' + id)
  }

  return (
    <div className={css.mainWrap}>
      <header className="top">
        <div className="left">
          <Tap className={'icon ' + css.whoBtn} aria-label="누가 놀까 다시 고르기" onTap={() => go('/who')}>
            {who === 'dong' ? <Avatar role="dong" /> : who === 'hyeong' ? <Avatar role="hyeong" /> : <span className={css.twoHeads}><Avatar role="hyeong" /><Avatar role="dong" /></span>}
          </Tap>
        </div>
        <div className="right">
          <Tap className={css.stickerBtn} aria-label="우리 스티커판" onTap={() => go('/stickers')}>
            <StarSticker /> <span>{total}</span>
          </Tap>
          <Tap className="icon small" aria-label="어른 설정" onTap={() => setGate(true)}>⚙️</Tap>
        </div>
      </header>
      <main className={css.grid + (list.length <= 4 ? ' ' + css.grid4 : '')}>
        {list.map((g) => (
          <Card
            key={g.id}
            art={<GameArt id={g.art || g.id} />}
            label={g.name}
            glow={!over && who === 'both' && !!g.together}
            dim={over}
            badge={over ? '🔒' : who === 'both' && g.together ? '둘이 같이!' : undefined}
            className={busy === g.id ? css.picked : undefined}
            style={{ '--kc': g.color } as CSSProperties}
            onTap={() => open(g.id)}
          />
        ))}
        {!list.length && <div className={css.empty}><Dundeuni face="surprise" className={css.emptyPic} /><p className="sub">보이는 게임이 없어요. 어른 설정에서 게임을 켜 주세요.</p></div>}
      </main>
      {gate && <ParentGate onClose={() => setGate(false)} onPass={() => { setGate(false); unlockParent(); go('/parent') }} />}
    </div>
  )
}

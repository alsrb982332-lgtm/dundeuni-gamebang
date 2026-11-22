import { Suspense, useEffect } from 'react'
import { useParams } from 'react-router'
import { gameById } from '../games/registry'
import { LegacyFrame } from '../games/LegacyFrame'
import { GameShell } from '../shared/GameShell'
import { Dundeuni } from '../shared/Dundeuni'
import { useSettings } from '../shared/settings'
import { useGo } from '../kids-mode/BackGuard'
import { isOver, playTimeStore } from '../parent/playtime'
import css from './app.module.css'

/* 게임 화면: 공통 틀(GameShell) 안에 게임을 띄움 */
export function Play() {
  const { id } = useParams()
  const go = useGo()
  const s = useSettings()
  const game = gameById(id)
  const blocked = !game || s.gamesOff.includes(game.id)
  const over = isOver(playTimeStore.get(), s.dailyLimitMin)

  useEffect(() => {
    if (blocked) go('/main')
    else if (over) go('/sleep')
  }, [blocked, over]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!game || blocked || over) return null

  const home = () => go('/main')
  return (
    <GameShell onHome={home} onTimeUp={() => go('/sleep')} color={game.color}>
      {game.kind === 'legacy' ? (
        <LegacyFrame key={game.id} game={game} />
      ) : (
        <Suspense fallback={<div className={css.center}><Dundeuni face="cheer" className={css.emptyPic} /></div>}>
          <game.component onExit={home} />
        </Suspense>
      )}
    </GameShell>
  )
}

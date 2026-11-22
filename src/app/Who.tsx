import { useEffect } from 'react'
import { Tap } from '../shared/Tap'
import { Avatar } from '../shared/Avatar'
import { useProfile, type Who as WhoT } from '../shared/useProfile'
import { say } from '../shared/useVoice'
import { sfx } from '../shared/sfx'
import { useAlive } from '../shared/useAlive'
import { useGo } from '../kids-mode/BackGuard'
import css from './app.module.css'

/* 누가 놀까? 형 / 동생 / 둘이 같이 */
export function Who() {
  const go = useGo()
  const alive = useAlive()
  const { names, setWho } = useProfile()
  useEffect(() => { const t = setTimeout(() => void say('who'), 300); return () => clearTimeout(t) }, [])

  const choose = async (w: WhoT) => {
    sfx.pop()
    setWho(w)
    await say(w === 'both' ? 'who_both' : w === 'hyeong' ? 'who_hyeong' : 'who_dong')
    if (alive()) go('/main')
  }

  return (
    <main className={css.page}>
      <Tap className="ask" onTap={() => void say('who')}><span>🔈</span> 누가 놀까?</Tap>
      <div className={css.whoRow}>
        <Tap className={css.who} aria-label={names.hyeong} onTap={() => choose('hyeong')}>
          <span className={css.whoPics}><Avatar role="hyeong" wave /></span>
          <span className={css.whoName}>{names.hyeong}</span>
        </Tap>
        <Tap className={css.who} aria-label={names.dong} onTap={() => choose('dong')}>
          <span className={css.whoPics}><Avatar role="dong" wave /></span>
          <span className={css.whoName}>{names.dong}</span>
        </Tap>
        <Tap className={css.who + ' ' + css.whoBoth} aria-label="둘이 같이" onTap={() => choose('both')}>
          <span className={css.whoPics}><Avatar role="hyeong" mood="joy" /><Avatar role="dong" mood="joy" /></span>
          <span className={css.whoName}>둘이 같이</span>
        </Tap>
      </div>
    </main>
  )
}

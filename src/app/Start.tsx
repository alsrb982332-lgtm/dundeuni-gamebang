import { Dundeuni } from '../shared/Dundeuni'
import { BigButton } from '../shared/BigButton'
import { unlockAudio, sfx } from '../shared/sfx'
import { requestAppFullscreen } from '../kids-mode/device'
import { useGo } from '../kids-mode/BackGuard'
import css from './app.module.css'

const DECO = ['⭐', '🦕', '☀️', '🧱', '✏️', '🌈', '🐻', '🐰', '✨', '🎈']
const TITLE = '든든이 게임방'

/* 시작 화면: 든든이 + 「놀러 가기」 */
export function Start() {
  const go = useGo()
  return (
    <main className={css.start}>
      <div className={css.deco} aria-hidden="true">
        {DECO.map((e, i) => (
          <span key={i} style={{ left: `${(i * 37) % 92}%`, top: `${(i * 53) % 86}%`, ['--fs' as string]: `${28 + (i % 3) * 10}px`, ['--dur' as string]: `${4 + (i % 4)}s`, ['--dl' as string]: `${-i * 0.7}s`, ['--rot' as string]: `${(i % 2 ? 1 : -1) * 8}deg` }}>{e}</span>
        ))}
      </div>
      <h1 className={css.title} aria-label={TITLE}>
        {[...TITLE].map((c, i) => (c === ' ' ? <span key={i} className={css.sp} /> : <span key={i} style={{ ['--i' as string]: i }}>{c}</span>))}
      </h1>
      <Dundeuni face="cheer" className={css.hero} />
      <BigButton bounce label="놀러 가기" onTap={() => {
        unlockAudio()
        requestAppFullscreen()
        sfx.pop()
        go('/who')
      }}>🎈 놀러 가기</BigButton>
    </main>
  )
}

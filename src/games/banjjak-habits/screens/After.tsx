import { cx } from '../cx'
import { useEffect, useState } from 'react'
import { DundunStage, HabitSticker, StepIcon } from '../components/Habit'
import type { Habit } from '../data/habits'
import { say } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import { confetti } from '../../../shared/fx'
import { sleep } from '../../../shared/storage'

/* ---------- 반짝반짝 완성 화면 ---------- */
export function Complete({ habit, onSticker, onNext }: { habit: Habit; onSticker: () => void; onNext: () => void }) {
  const alive = useAlive()
  const [got, setGot] = useState(false)
  useEffect(() => {
    (async () => {
      sfx.sparkle()
      await say(`done_${habit.id}`, { text: habit.done })
      if (!alive()) return
      setGot(true)
      onSticker()
      sfx.fanfare()
      confetti(['✨', '⭐', habit.sparkle || '💛'])
      await say('play_sticker')
      await sleep(700)
      if (alive()) onNext()
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className={cx('screen complete')}>
      <h2 className={cx('shine-title')}>반짝반짝!</h2>
      <DundunStage playing={0} sparkle scene={habit.scene}>
        <span className={cx('sparkle-thing')}><StepIcon icon={habit.sparkle || habit.icon} /></span>
      </DundunStage>
      {got && <HabitSticker icon={habit.icon} className={cx('pop-sticker')} />}
    </main>
  )
}


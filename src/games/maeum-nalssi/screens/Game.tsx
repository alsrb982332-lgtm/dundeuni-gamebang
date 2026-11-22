import { cx } from '../cx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EMOTIONS, type EmotionId, type Situation } from '../data/emotions'
import { buildRound, hasActStep, pickActions, pickOptions, type Mode } from '../rounds'
import { Scene } from '../components/Scene'
import { ActionCard, EmotionCard } from '../components/Cards'
import { Tap } from '../../../shared/Tap'
import { Dundun, StarSticker, type Mood, type Weather } from '../../../shared/art/Art'
import { say, line, fill } from '../../../shared/useVoice'
import { useAlive } from '../../../shared/useAlive'
import { sfx } from '../../../shared/sfx'
import { confetti } from '../../../shared/fx'
import { pick, sleep } from '../../../shared/storage'
import type { Settings } from '../progress'

export type { Mode }

type Props = { mode: Mode; settings: Settings; onStar: () => void; onDone: (stars: number) => void; onHome: () => void }

export function Game({ mode, settings, onStar, onDone, onHome }: Props) {
  const round = useMemo(() => buildRound(mode, mode === 'dong' ? settings.dongCount : settings.hyeongCount, settings.off), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [qi, setQi] = useState(0)
  const [got, setGot] = useState(0)
  const gotRef = useRef(0)
  if (!round.length) return <div className={cx('screen')}><p className={cx('sub')}>상황이 하나도 없어요. 설정에서 상황을 켜 주세요.</p></div>
  return (
    <>
      <header className={cx('top')}>
        <div className={cx('left')}>
          <Tap className={cx('icon')} aria-label="처음으로" onTap={onHome}>◀</Tap>
          <div className={cx('dots')} aria-label={`${qi + 1}번째 문제`}>
            {round.map((_, i) => <i key={i} className={cx(i < qi ? 'on' : i === qi ? 'now' : '')} />)}
          </div>
        </div>
        <div className={cx('right')}>
          <div className={cx('stars')}><StarSticker /> {got}</div>
        </div>
      </header>
      <Question
        key={qi}
        sit={round[qi]}
        mode={mode}
        choices={settings.hyeongChoices}
        onPraise={() => { onStar(); gotRef.current++; setGot(gotRef.current) }}
        onNext={() => (qi + 1 < round.length ? setQi(qi + 1) : onDone(gotRef.current))}
      />
    </>
  )
}

type Phase = 'story' | 'feel' | 'act' | 'praise'

function Question({ sit, mode, choices, onPraise, onNext }: { sit: Situation; mode: Mode; choices: number; onPraise: () => void; onNext: () => void }) {
  const alive = useAlive()
  const emo = EMOTIONS[sit.emotion]
  const hasAct = hasActStep(sit, mode)

  /* 보기 카드: 정답 + 다른 감정 */
  const options = useMemo<EmotionId[]>(() => pickOptions(sit, mode, choices), [sit, mode, choices])
  const acts = useMemo(() => pickActions(sit), [sit])

  const [phase, setPhase] = useState<Phase>('story')
  const [friendMood, setFriendMood] = useState<Mood>(emo.mood)
  const [badge, setBadge] = useState<'q' | Weather | null>(null)
  const [fx, setFx] = useState<Weather | null>(null)
  const [cardState, setCardState] = useState<Record<string, 'right' | 'wobble'>>({})
  const [actState, setActState] = useState<Record<number, 'good' | 'wobble'>>({})
  const [hi, setHi] = useState(-1)
  const [hint, setHint] = useState(false)
  const [nope, setNope] = useState(false)
  const [cheer, setCheer] = useState(false)
  const wrong = useRef(0)
  const seq = useRef(0) // 아이가 누를 때마다 바뀜 → 읽어 주던 안내를 멈춤
  const locked = useRef(false)

  const askKey = sit.ask ? `ask_${sit.id}` : 'ask_feel'

  async function readOptions(keys: { key: string; text?: string }[]) {
    const my = ++seq.current
    for (let i = 0; i < keys.length; i++) {
      if (!alive() || seq.current !== my) return
      setHi(i)
      await say(keys[i].key, { text: keys[i].text })
      await sleep(150)
    }
    if (alive() && seq.current === my) setHi(-1)
  }

  async function playStory() {
    const my = ++seq.current
    setPhase('story')
    await sleep(500)
    await say(`sit_${sit.id}`, { text: sit.story })
    if (!alive() || seq.current !== my) return
    await sleep(900)
    if (!alive() || seq.current !== my) return
    goFeel()
  }

  async function goFeel() {
    const my = ++seq.current
    setPhase('feel')
    setBadge('q')
    await say(askKey, { text: sit.ask })
    if (!alive() || seq.current !== my) return
    await readOptions(options.map((o) => ({ key: `name_${o}` })))
  }

  async function goAct() {
    setFx(null)
    const my = ++seq.current
    setPhase('act')
    setHint(false)
    wrong.current = 0
    await say('ask_act')
    if (!alive() || seq.current !== my) return
    await readOptions(acts.map((a) => ({ key: `act_${sit.id}_${(sit.actions || []).indexOf(a) + 1}`, text: a.label })))
  }

  async function goPraise() {
    seq.current++
    setPhase('praise')
    setCheer(true)
    onPraise()
    sfx.fanfare()
    confetti(['⭐', '💛', '☀️', '✨'])
    await say(pick(['praise_1', 'praise_1', 'praise_2', 'praise_3']))
    if (!alive()) return
    await sleep(900)
    if (alive()) onNext()
  }

  useEffect(() => {
    playStory()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onFeel(id: EmotionId) {
    if (locked.current || phase !== 'feel') return
    seq.current++
    setHi(-1)
    if (id === sit.emotion) {
      locked.current = true
      sfx.ding()
      setCardState({ [id]: 'right' })
      setBadge(emo.weather)
      setFx(emo.weather)
      setHint(false)
      await say(`right_${id}`)
      if (!alive()) return
      await sleep(500)
      if (!alive()) return
      locked.current = false
      if (hasAct) goAct()
      else goPraise()
    } else {
      sfx.hmm()
      wrong.current++
      setCardState({ [id]: 'wobble' })
      setTimeout(() => alive() && setCardState({}), 650)
      const showHint = mode === 'dong' || wrong.current >= 2
      if (showHint) setHint(true)
      const my = seq.current
      await say('retry_feel')
      if (showHint && alive() && seq.current === my) await say('hint')
    }
  }

  async function onAct(i: number) {
    if (locked.current || phase !== 'act') return
    seq.current++
    setHi(-1)
    const a = acts[i]
    if (a.good) {
      locked.current = true
      sfx.sparkle()
      setActState({ [i]: 'good' })
      setFriendMood('joy')
      setBadge('sun')
      setFx('sun')
      setHint(false)
      if (a.reply) await say(`reply_${sit.id}_${(sit.actions || []).indexOf(a) + 1}`, { text: a.reply })
      else await say('good_act')
      if (!alive()) return
      locked.current = false
      goPraise()
    } else {
      sfx.hmm()
      wrong.current++
      setActState({ [i]: 'wobble' })
      setFriendMood(sit.emotion === 'happy' ? 'upset' : emo.mood)
      setBadge(sit.emotion === 'happy' ? 'cloud' : emo.weather)
      setNope(true)
      setTimeout(() => { if (alive()) { setActState({}); setNope(false) } }, 700)
      if (wrong.current >= 2) setHint(true)
      if (sit.badReply) await say(`bad_${sit.id}`, { text: sit.badReply })
      else await say(`bad_${sit.emotion}`)
    }
  }

  /* 🔈 다시 듣기 */
  function replay() {
    if (phase === 'story') playStory()
    else if (phase === 'feel') goFeel()
    else if (phase === 'act') goAct()
  }

  const prompt =
    phase === 'story' ? sit.story
      : phase === 'feel' ? (sit.ask ?? line('ask_feel'))
        : phase === 'act' ? line('ask_act') : line('praise_1')

  return (
    <main className={cx('screen game phase-' + phase)}>
      <Scene
        sit={sit}
        friendMood={friendMood}
        badge={badge}
        fx={fx}
        dundunMood={cheer ? 'joy' : phase === 'feel' || phase === 'act' ? 'neutral' : 'surprised'}
        nope={nope}
        cheer={cheer}
        onTap={() => phase === 'story' && playStory()}
      />
      <Tap className={cx('ask')} onTap={replay} aria-label="다시 듣기">
        <span className={cx('spk')}>🔈</span>
        <span>{fill(prompt)}</span>
      </Tap>
      {phase === 'feel' && (
        <div className={cx('cards n' + options.length)}>
          {options.map((o, i) => (
            <EmotionCard key={o} id={o} state={cardState[o]} hi={hi === i} hint={hint && o === sit.emotion} onTap={() => onFeel(o)} />
          ))}
        </div>
      )}
      {phase === 'act' && (
        <div className={cx('cards acts n' + acts.length)}>
          {acts.map((a, i) => (
            <ActionCard key={i} a={a} state={actState[i]} hi={hi === i} hint={hint && a.good} onTap={() => onAct(i)} />
          ))}
        </div>
      )}
      {phase === 'story' && <div className={cx('cards placeholder')} />}
      {phase === 'praise' && (
        <div className={cx('praise')} role="status">
          <div className={cx('praise-card')}>
            <Dundun mood="joy" wave className={cx('pd')} />
            <StarSticker className={cx('ps')} />
            <h2>마음을 잘 알아줬구나!</h2>
          </div>
        </div>
      )}
    </main>
  )
}

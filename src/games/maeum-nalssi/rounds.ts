import SITUATIONS from './data/situations.json'
import { ALL_EMOTIONS, DONG_EMOTIONS, EMOTIONS, type EmotionId, type Situation } from './data/emotions'
import { shuffle } from '../../shared/storage'

/* 한 판 문제·보기 고르기 (01번 의뢰서 4장 「난이도 모드」)
   동생 모드: 기뻐요·슬퍼요만, 보기 2개, 3문제, 행동 고르기 없음
   형 모드:   감정 6개, 보기 3~4개, 5문제, 행동 고르기 있음 */
export type Mode = 'dong' | 'hyeong'
export const ALL_SITUATIONS = SITUATIONS as Situation[]

export const fitsMode = (x: Situation, mode: Mode) =>
  (x.modes || ['dong', 'hyeong']).includes(mode) && (mode === 'hyeong' || DONG_EMOTIONS.includes(x.emotion)) && !!EMOTIONS[x.emotion]

/** 한 판에 나올 상황 (같은 상황이 연달아 나오지 않게 섞음). 꺼 둔 상황은 빼고, 다 꺼져 있으면 전부에서 */
export function buildRound(mode: Mode, count: number, off: number[], all: Situation[] = ALL_SITUATIONS): Situation[] {
  let pool = all.filter((x) => fitsMode(x, mode) && !off.includes(x.id))
  if (!pool.length) pool = all.filter((x) => fitsMode(x, mode))
  const out: Situation[] = []
  while (out.length < count && pool.length) out.push(...shuffle(pool))
  return out.slice(0, count)
}

/** 기분 카드 보기: 정답 + 다른 감정 (동생 2개, 형 3~4개) */
export function pickOptions(sit: Situation, mode: Mode, choices: number): EmotionId[] {
  const others = (mode === 'dong' ? DONG_EMOTIONS : ALL_EMOTIONS).filter((e) => e !== sit.emotion)
  const n = mode === 'dong' ? 2 : Math.max(3, Math.min(4, choices))
  return shuffle([sit.emotion, ...shuffle(others).slice(0, n - 1)])
}

/** 행동 카드 (형 모드, 2~3개) */
export const pickActions = (sit: Situation) => shuffle(sit.actions || []).slice(0, 3)

export const hasActStep = (sit: Situation, mode: Mode) => mode === 'hyeong' && !!sit.actions?.length
